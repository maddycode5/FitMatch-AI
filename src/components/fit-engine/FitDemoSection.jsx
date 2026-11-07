import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function FitDemoSection() {
  const [selectedFabric, setSelectedFabric] = useState('cashmere');

  const fabrics = [
    { id: 'cashmere', name: 'Raw Cashmere', weight: '380 GSM', drape: 'Soft-Fluid' },
    { id: 'silk', name: 'Mulberry Silk', weight: '120 GSM', drape: 'Gossamer' },
    { id: 'wool', name: 'Super 150s Wool', weight: '290 GSM', drape: 'Tailored-Rigid' }
  ];

  return (
    <section id="fit-engine" className="w-full py-28 px-6 bg-[#080808] border-t border-white/[0.06]">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-mono">
              The AI Engine
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl text-white font-normal leading-tight">
              Morphological AI <br />
              <span className="italic font-light text-neutral-400">meets fine tailoring.</span>
            </h2>
            <p className="text-neutral-400 text-sm font-light leading-relaxed">
              Traditional sizing charts are obsolete. FitMatch AI uses neural radiance fields and cloth collision shaders to test the garment on your exact posture, waistline, and movement style.
            </p>

            {/* Fabric Selector Interactive Pill Group */}
            <div className="pt-4 space-y-3">
              <label className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Select Active Drape Simulator:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {fabrics.map((fabric) => (
                  <button
                    key={fabric.id}
                    onClick={() => setSelectedFabric(fabric.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedFabric === fabric.id
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/5 bg-neutral-900/40 text-neutral-400 hover:border-white/20'
                    }`}
                  >
                    <div className="text-xs font-medium">{fabric.name}</div>
                    <div className="text-[10px] font-mono text-neutral-400 mt-1">{fabric.weight}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Diagnostic Dashboard */}
          <div className="lg:col-span-7 glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-10">
              <Sparkles className="w-32 h-32 text-white" />
            </div>

            <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
              <div>
                <h3 className="text-lg font-serif text-white">Live Fit Analysis</h3>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">AVATAR ID: #FIT-9021</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase">Calibrated</span>
              </div>
            </div>

            {/* Diagnostic Bars */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-300">Torso Compression & Tension</span>
                  <span className="font-mono text-white">0.04 MPa (Optimal)</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-4/5" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-300">Sleeve Articulation Range</span>
                  <span className="font-mono text-white">164° Degrees Freedom</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-[94%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-neutral-300">Thermal Heat Distribution</span>
                  <span className="font-mono text-white">Breathable / 0.8 Clo</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-neutral-400 w-3/5" />
                </div>
              </div>
            </div>

            {/* Final Match Recommendation Box */}
            <div className="mt-8 p-4 rounded-2xl bg-white text-black flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-600">
                  Recommended Size
                </div>
                <div className="font-serif text-2xl font-bold">42 Long • Tailored Comfort</div>
              </div>
              <button className="bg-black text-white px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-neutral-800 transition-colors">
                Apply Fit
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
