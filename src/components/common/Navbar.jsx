import React from 'react';
import { ScanLine, ShoppingBag, Sliders } from 'lucide-react';

export default function Navbar({ onOpenFitFinder, currentProfile }) {
  return (
    <header className="fixed top-0 left-0 w-full z-40 px-6 md:px-12 py-5 flex items-center justify-between pointer-events-none">
      {/* Brand Monogram */}
      <div className="pointer-events-auto flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-serif font-bold text-lg tracking-tighter shadow-xl">
          F
        </div>
        <span className="font-serif tracking-widest text-lg font-light uppercase text-white">
          FitMatch<span className="text-neutral-500 font-sans text-xs ml-1.5 font-normal tracking-normal border border-neutral-700 px-1.5 py-0.5 rounded">AI</span>
        </span>
      </div>

      {/* Floating Center Navigation */}
      <nav className="pointer-events-auto hidden md:flex items-center gap-8 glass-panel px-7 py-2.5 rounded-full shadow-2xl">
        <button
          onClick={onOpenFitFinder}
          className="text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white transition-colors"
        >
          Fit Finder
        </button>
        <a href="#studio-3d" className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors">
          3D Atelier
        </a>
        <a href="#collection" className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition-colors">
          Collection
        </a>
      </nav>

      {/* Actions */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          onClick={onOpenFitFinder}
          className="hidden sm:flex items-center gap-2 glass-pill text-xs uppercase tracking-[0.18em] px-4 py-2.5 rounded-full hover:bg-white hover:text-black transition-all duration-300"
        >
          <ScanLine className="w-3.5 h-3.5" />
          <span>Universal Profile</span>
        </button>

        <a
          href="#studio-3d"
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white hover:border-white/40 transition-colors"
          title="Go to 3D Customizer"
        >
          <Sliders className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
}
