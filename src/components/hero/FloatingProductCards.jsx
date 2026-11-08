import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, ArrowDownRight, ExternalLink } from 'lucide-react';

export default function FloatingProductCards({ customerProfile, onOpenFitFinder }) {
  const shoulderVal = customerProfile?.measurements?.shoulder_cm || 45.0;
  const chestVal = customerProfile?.measurements?.chest_cm || 98.0;
  const baseGarmentChest = 108.0;
  const chestEase = (baseGarmentChest - chestVal).toFixed(1);

  const scrollToAtelier = () => {
    const el = document.getElementById('studio-3d');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Far-Left Card: Archive Garment Specification SKU */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={scrollToAtelier}
        className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-6 lg:left-10 z-20 w-64 glass-panel p-4 rounded-2xl shadow-2xl border border-white/10 hidden xl:block pointer-events-auto cursor-pointer hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.2)] transition-all group"
        title="Click to try on this garment in the 3D Atelier"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono tracking-wider uppercase text-neutral-400 group-hover:text-cyan-300 transition-colors">
            SKU #092-NOIR
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready to Drape</span>
          </span>
        </div>
        <h4 className="font-serif text-base font-medium text-white mb-1 group-hover:text-cyan-200 transition-colors flex items-center justify-between">
          <span>Structured Trench Coat</span>
          <ArrowDownRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyan-400" />
        </h4>
        <p className="text-xs text-neutral-400 mb-3 font-light leading-relaxed">
          Procedurally draped with double-breasted twill & waist sash.
        </p>
        <div className="flex justify-between items-center pt-2.5 border-t border-white/5 text-xs font-mono text-neutral-300">
          <span className="font-semibold text-white">EUR 1,480</span>
          <span className="text-cyan-400 text-[11px] font-medium group-hover:underline">Try in Atelier ↓</span>
        </div>
      </motion.div>

      {/* Far-Right Card: Real-time Biometric Fit Engine Telemetry */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.0, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        onClick={scrollToAtelier}
        className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 lg:right-10 z-20 w-72 glass-panel p-5 rounded-2xl shadow-2xl border border-white/10 hidden xl:block pointer-events-auto cursor-pointer hover:border-cyan-400/60 hover:shadow-[0_0_35px_rgba(0,240,255,0.25)] transition-all group"
        title="Live Biometric Telemetry — Click to inspect and adjust in the 3D Atelier"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg shadow-cyan-400/40">
              <Sparkles className="w-3 h-3" />
            </div>
            <span className="text-[11px] uppercase tracking-widest text-neutral-200 font-medium group-hover:text-cyan-300 transition-colors">
              Biometric Fit Engine
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-neutral-400">Shoulder Width</span>
              <span className="font-mono text-cyan-300 font-medium">{shoulderVal} cm (Exact)</span>
            </div>
            <div className="w-full bg-neutral-800/80 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full w-[96%] rounded-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-neutral-400">Chest Drape Ease</span>
              <span className="font-mono text-white font-medium">+{chestEase} cm (Tailored)</span>
            </div>
            <div className="w-full bg-neutral-800/80 h-1.5 rounded-full overflow-hidden p-0.5 border border-white/5">
              <div className="bg-gradient-to-r from-blue-400 to-cyan-300 h-full w-[92%] rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero Return Risk
          </span>
          <span className="font-mono text-cyan-400 text-[10px] uppercase font-semibold group-hover:underline flex items-center gap-0.5">
            <span>Inspect 3D</span>
            <ArrowDownRight className="w-3 h-3" />
          </span>
        </div>
      </motion.div>
    </>
  );
}
