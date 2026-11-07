import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function FloatingProductCards() {
  return (
    <>
      {/* Far-Left Card: Garment Specification & Fabric SKU */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 lg:left-10 z-20 w-64 glass-panel p-4 rounded-2xl shadow-2xl border border-white/10 hidden xl:block pointer-events-none"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400">
            SKU #092-NOIR
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Ready to Drape
          </span>
        </div>
        <h4 className="font-serif text-base font-medium text-white mb-1">
          Structured Trench Coat
        </h4>
        <p className="text-xs text-neutral-400 mb-3 font-light leading-relaxed">
          Procedurally modeled with micro-crease dynamics.
        </p>
        <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-xs font-mono text-neutral-300">
          <span className="font-semibold text-white">EUR 1,480</span>
          <span className="text-neutral-400">Size: Custom 40R</span>
        </div>
      </motion.div>

      {/* Far-Right Card: Real-time Biometric Telemetry */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 lg:right-10 z-20 w-72 glass-panel p-5 rounded-2xl shadow-2xl border border-white/10 hidden xl:block pointer-events-none"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shadow">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-neutral-200 font-medium">
            Biometric Fit Engine
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-neutral-400">Shoulder Width</span>
              <span className="font-mono text-white font-medium">46.2 cm (Exact)</span>
            </div>
            <div className="w-full bg-neutral-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-white h-full w-[96%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-neutral-400">Chest Drape Ease</span>
              <span className="font-mono text-white font-medium">+3.8 cm (Tailored)</span>
            </div>
            <div className="w-full bg-neutral-800/80 h-1.5 rounded-full overflow-hidden">
              <div className="bg-white h-full w-[92%]" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero Return Risk
          </span>
          <span className="font-mono text-neutral-500">v4.2</span>
        </div>
      </motion.div>
    </>
  );
}
