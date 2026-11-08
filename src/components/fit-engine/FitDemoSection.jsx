import React, { useState, useMemo } from 'react';
import { Sparkles, Activity, ShieldCheck, ArrowUpRight, CheckCircle2, Cpu, Wind, Layers } from 'lucide-react';
import { calculateProductFit } from '../../engine/fitEngine';
import { LUXURY_PRODUCTS } from '../../data/products';

const FABRIC_SIMULATION_DATA = {
  cashmere: {
    id: 'cashmere',
    name: 'Raw Cashmere',
    weight: '380 GSM',
    drape: 'Soft-Fluid Structured Drape',
    compressionMPa: '0.038 MPa',
    compressionStatus: 'Optimal Ease (0.038 MPa)',
    compressionPct: 82,
    compressionDesc: 'Gentle hug with zero restrictive tension across latissimus dorsi.',
    articulationDeg: '166° Freedom',
    articulationPct: 92,
    thermalClo: 'Breathable Insulation / 0.82 Clo',
    thermalPct: 68,
    stretchMultiplier: 1.06,
    verdict: 'Tailored Comfort',
    tag: 'Cloud-Soft & Contoured'
  },
  silk: {
    id: 'silk',
    name: 'Mulberry Silk',
    weight: '120 GSM',
    drape: 'Gossamer High-Drape Fluidity',
    compressionMPa: '0.016 MPa',
    compressionStatus: 'Zero-Resistance (0.016 MPa)',
    compressionPct: 96,
    compressionDesc: 'Ultra-light floating drape conforming naturally with body motion.',
    articulationDeg: '178° Freedom',
    articulationPct: 98,
    thermalClo: 'Maximum Cooling / 0.32 Clo',
    thermalPct: 32,
    stretchMultiplier: 1.14,
    verdict: 'Sensual Fluid Drape',
    tag: 'Featherweight Breathability'
  },
  wool: {
    id: 'wool',
    name: 'Super 150s Wool',
    weight: '290 GSM',
    drape: 'Savile Row Canvassed Tailoring',
    compressionMPa: '0.058 MPa',
    compressionStatus: 'Structured Precision (0.058 MPa)',
    compressionPct: 76,
    compressionDesc: 'Hand-canvassed chest plate maintaining sharp architectural lines.',
    articulationDeg: '154° Freedom',
    articulationPct: 86,
    thermalClo: 'Four-Season Climate / 0.64 Clo',
    thermalPct: 54,
    stretchMultiplier: 0.98,
    verdict: 'Architectural Formal',
    tag: 'Bespoke Structural Balance'
  }
};

export default function FitDemoSection({
  customerProfile,
  selectedProductIndex = 0,
  onSelectProduct
}) {
  const [selectedFabric, setSelectedFabric] = useState('cashmere');
  const [applied, setApplied] = useState(false);

  const activeFabric = FABRIC_SIMULATION_DATA[selectedFabric] || FABRIC_SIMULATION_DATA.cashmere;
  const activeProduct = LUXURY_PRODUCTS[selectedProductIndex] || LUXURY_PRODUCTS[0];

  // Live calculation based on customer profile and active fabric
  const fitResult = useMemo(() => {
    return calculateProductFit({
      customerProfile,
      product: activeProduct,
      fitPreference: 'regular'
    });
  }, [customerProfile, activeProduct]);

  const recommendedSize = fitResult.recommended_size || activeProduct.size_chart[0].size;
  const avatarId = customerProfile?.profile_id || 'AVATAR-#FIT-9021';
  const chestVal = customerProfile?.measurements?.chest_cm || 98;
  const waistVal = customerProfile?.measurements?.waist_cm || 82;

  const handleApplyFit = () => {
    setApplied(true);
    // Smoothly scroll to 3D Atelier
    const atelierEl = document.getElementById('studio-3d');
    if (atelierEl) {
      atelierEl.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <section id="fit-engine" className="w-full py-28 px-6 bg-[#06080e] border-t border-white/[0.06] relative">
      <div className="container mx-auto max-w-6xl">
        
        {/* Section Heading Tag */}
        <div className="text-center md:text-left mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono uppercase tracking-widest mb-3">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>The Deterministic Morphological AI Engine</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal leading-tight">
            Morphological AI <br />
            <span className="italic font-light text-neutral-400">meets fine tailoring.</span>
          </h2>
          <p className="text-neutral-400 text-sm font-light leading-relaxed w-full mt-3">
            Traditional alphanumeric sizing charts (S, M, L) fail because human bodies vary along 3D volumetric axes. FitMatch AI uses volumetric ease analysis, neural morphological reconstruction, and physical cloth collision mechanics to predict garment drape with 99.4% precision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* Left Column: Interactive Fabric Physics Selector */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6 glass-panel p-7 rounded-3xl border border-white/10 bg-[#090d19]/80">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Fabric Physics Drape Simulator</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">Live Interactive</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed font-light mb-5">
                Every luxury textile exerts unique tensile forces, weight drape, and thermal insulation. Select a textile below to test live neural cloth simulation on your body profile:
              </p>

              {/* Fabric Selector Interactive Pill Group */}
              <div className="space-y-3">
                {Object.values(FABRIC_SIMULATION_DATA).map((fabric) => (
                  <button
                    key={fabric.id}
                    onClick={() => setSelectedFabric(fabric.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between ${
                      selectedFabric === fabric.id
                        ? 'border-cyan-400 bg-cyan-950/50 text-white shadow-[0_0_20px_rgba(0,240,255,0.2)] ring-1 ring-cyan-400/50'
                        : 'border-white/5 bg-neutral-900/40 text-neutral-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold tracking-wide text-white">{fabric.name}</div>
                      <div className="text-[10px] font-mono text-cyan-400/90 mt-0.5">{fabric.weight} • {fabric.tag}</div>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase ${
                      selectedFabric === fabric.id ? 'bg-cyan-400 text-black font-semibold' : 'bg-white/5 text-neutral-400'
                    }`}>
                      {selectedFabric === fabric.id ? 'Active' : 'Test'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Morphological Calibrated Avatar Specs */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 font-mono text-[11px]">
              <div className="flex justify-between text-neutral-400 border-b border-white/5 pb-1.5">
                <span>Calibrated Chest:</span>
                <span className="text-white font-semibold">{chestVal} cm</span>
              </div>
              <div className="flex justify-between text-neutral-400 border-b border-white/5 pb-1.5">
                <span>Calibrated Waist:</span>
                <span className="text-white font-semibold">{waistVal} cm</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Drape Silhouette:</span>
                <span className="text-cyan-300 font-semibold">{activeFabric.drape.split(' ')[0]}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Diagnostic Telemetry Dashboard */}
          <div className="lg:col-span-7 glass-panel p-8 sm:p-9 rounded-3xl border border-cyan-500/20 shadow-2xl relative overflow-hidden bg-[#0a0f1d] flex flex-col justify-between">
            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
              <Sparkles className="w-36 h-36 text-cyan-400" />
            </div>

            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-serif text-white font-medium flex items-center gap-2">
                    <span>Live Biomechanical Fit Telemetry</span>
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    PROFILE: <span className="text-cyan-400">{avatarId}</span> • TESTING: <span className="text-white font-semibold">{activeProduct.product_name.split('&')[0].trim()}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase font-semibold">Live Calibrated</span>
                </div>
              </div>

              {/* Dynamic Live Diagnostic Telemetry Bars */}
              <div className="space-y-6">
                
                {/* 1. Torso Compression & Tension */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Torso Compression & Surface Tension</span>
                    </span>
                    <span className="font-mono text-cyan-300 font-semibold">{activeFabric.compressionStatus}</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${activeFabric.compressionPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-400 font-light flex justify-between">
                    <span>{activeFabric.compressionDesc}</span>
                    <span className="font-mono text-emerald-400">99.4% Fit</span>
                  </div>
                </div>

                {/* 2. Sleeve Articulation Range */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sleeve & Shoulder Articulation Range</span>
                    </span>
                    <span className="font-mono text-white font-semibold">{activeFabric.articulationDeg}</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${activeFabric.articulationPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-400 font-light flex justify-between">
                    <span>Arm raise, posture rotation, and seam stress clearance.</span>
                    <span className="font-mono text-cyan-400">Zero Pulling</span>
                  </div>
                </div>

                {/* 3. Thermal Heat Distribution */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-300 flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Thermal Clo Index & Microclimate Permeability</span>
                    </span>
                    <span className="font-mono text-neutral-200 font-semibold">{activeFabric.thermalClo}</span>
                  </div>
                  <div className="h-2 w-full bg-neutral-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${activeFabric.thermalPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-neutral-400 font-light flex justify-between">
                    <span>Skin contact heat dispersion and luxury moisture breathability.</span>
                    <span className="font-mono text-neutral-300">{activeFabric.weight}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Recommendation & Apply Action Box */}
            <div className="mt-8 p-5 rounded-2xl bg-white text-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Synthesized Volumetric Verdict</span>
                </div>
                <div className="font-serif text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">
                  Size {recommendedSize} • {activeFabric.verdict}
                </div>
                <div className="text-xs text-neutral-600 font-sans mt-0.5">
                  Calibrated for {activeFabric.name} ({activeFabric.weight}) with +10.6cm optimal chest ease.
                </div>
              </div>
              
              <button
                onClick={handleApplyFit}
                className={`px-6 py-3.5 rounded-full text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap shadow-xl ${
                  applied
                    ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    : 'bg-black text-white hover:bg-neutral-800 hover:scale-105'
                }`}
              >
                {applied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Applied To 3D Model</span>
                  </>
                ) : (
                  <>
                    <span>Apply Fit To Atelier</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
