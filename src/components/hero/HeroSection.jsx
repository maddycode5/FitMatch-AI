import React from 'react';
import { motion } from 'framer-motion';
import GarmentHeroScene from '../3d/GarmentHeroScene';
import FloatingProductCards from './FloatingProductCards';
import { ArrowRight, RotateCw, SlidersHorizontal, ShieldCheck, Sparkles } from 'lucide-react';

export default function HeroSection({ onOpenFitFinder }) {
  return (
    <section className="relative w-full min-h-screen pt-24 pb-12 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#030611] via-[#020409] to-[#010206]">
      {/* Ambient Cyber Spotlight */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-cyan-500/[0.05] rounded-full blur-[180px] pointer-events-none" />

      {/* Far Outer Floating Cards (Cleanly docked at the outer margins) */}
      <FloatingProductCards />

      {/* Hero Headline Overlay */}
      <div className="relative z-10 container mx-auto px-6 text-center max-w-4xl mt-2">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 glass-pill px-4 py-1.5 rounded-full mb-4 border border-cyan-400/25 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff] animate-pulse" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-cyan-200 font-mono font-medium">
            Universal Body Measurement Intelligence
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-white leading-[1.04]"
        >
          Precision fit, <br />
          <span className="italic font-light text-neutral-300">rendered in 3D.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="text-neutral-400 text-sm sm:text-base max-w-xl mx-auto mt-4 font-light leading-relaxed"
        >
          Create your standardized body profile once. Compare true garment ease across physical size charts with zero brand conversion guesswork.
        </motion.p>
      </div>

      {/* Center 3D Interactive Cyber-Pod Viewport (Deep Dark Enclosure with Cyan Glow) */}
      <div className="relative w-full max-w-5xl mx-auto h-[56vh] sm:h-[64vh] z-10 flex items-center justify-center my-2 rounded-3xl overflow-hidden border border-cyan-500/20 shadow-[0_0_60px_rgba(0,240,255,0.15)] bg-[#040711]">
        
        {/* Top-Left Scanner Status HUD */}
        <div className="absolute top-4 left-5 z-20 hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider text-cyan-300 bg-cyan-950/70 border border-cyan-400/30 backdrop-blur-md pointer-events-none shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff] animate-ping" />
          <span>LiDAR 3D Mesh Active</span>
        </div>

        {/* Top-Right Calibration Telemetry HUD */}
        <div className="absolute top-4 right-5 z-20 hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[11px] font-mono text-neutral-300 bg-neutral-900/80 border border-white/10 backdrop-blur-md pointer-events-none shadow-lg">
          <span className="text-neutral-400">Tolerance:</span>
          <span className="font-semibold text-white">±0.1 mm Optical</span>
        </div>

        {/* The 3D Biometric Hologram Canvas */}
        <GarmentHeroScene />

        {/* Scene Interactive Hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-neutral-400 pointer-events-none bg-black/50 px-4 py-1 rounded-full border border-white/5 backdrop-blur-sm">
          <RotateCw className="w-3 h-3 animate-spin text-cyan-400" />
          <span>360° Volumetric Hologram • Drag to Inspect</span>
        </div>
      </div>

      {/* Call to Actions & Metric Bar */}
      <div className="relative z-10 container mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/[0.06] pt-7">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenFitFinder}
            className="bg-white text-black hover:bg-neutral-200 transition-colors font-medium text-xs uppercase tracking-[0.2em] px-7 py-3.5 rounded-full flex items-center gap-3 group shadow-2xl"
          >
            <span>Launch Fit Finder</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </button>

          <a
            href="#studio-3d"
            className="glass-panel text-white hover:border-white/40 transition-colors font-light text-xs uppercase tracking-[0.2em] px-6 py-3.5 rounded-full flex items-center gap-2"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open 3D Studio</span>
          </a>
        </div>

        {/* Telemetry Stats */}
        <div className="flex items-center gap-8 sm:gap-12">
          <div>
            <div className="font-serif text-xl sm:text-2xl text-white">0.1 mm</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">LiDAR Accuracy</div>
          </div>
          <div className="w-[1px] h-8 bg-neutral-800" />
          <div>
            <div className="font-serif text-xl sm:text-2xl text-white">100%</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Bespoke Ease</div>
          </div>
          <div className="w-[1px] h-8 bg-neutral-800" />
          <div>
            <div className="font-serif text-xl sm:text-2xl text-white">0 Brands</div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-mono">Guessed</div>
          </div>
        </div>
      </div>
    </section>
  );
}
