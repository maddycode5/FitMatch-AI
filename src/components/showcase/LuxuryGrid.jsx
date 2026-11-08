import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { LUXURY_PRODUCTS } from '../../data/products';

export default function LuxuryGrid({ onSelectProduct }) {
  const archiveItems = LUXURY_PRODUCTS.slice(0, 3);

  const handleTryOn = (idx) => {
    if (onSelectProduct) {
      onSelectProduct(idx);
    }
    const studioEl = document.getElementById('studio-3d');
    if (studioEl) {
      studioEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="collection" className="w-full py-24 px-6 bg-[#0A0A0A] border-t border-white/5">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-cyan-400 font-mono">
              The Virtual Archive
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-normal mt-2">
              Curated for your morphology
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 font-light mt-1">
              Select any real-life garment to try it on directly over your 3D biometric avatar.
            </p>
          </div>
          <a
            href="#studio-3d"
            className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            Open 3D Studio <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {archiveItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleTryOn(idx)}
              className="group cursor-pointer relative"
            >
              {/* Image Frame with Aspect Ratio */}
              <div className="w-full aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden relative mb-4 border border-white/10 group-hover:border-cyan-400/50 transition-all duration-500 shadow-xl group-hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]">
                <img
                  src={item.image}
                  alt={item.product_name}
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700 ease-out"
                />
                
                {/* 3D Fit Match Badge */}
                <div className="absolute top-4 left-4 glass-pill px-3 py-1 rounded-full text-[10px] font-mono text-cyan-300 border border-cyan-400/30">
                  Match: {item.matchScore}
                </div>

                {/* Floating Action Button */}
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="w-full py-2.5 px-4 bg-cyan-400 text-black font-semibold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xl">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Try On 3D Model</span>
                  </button>
                </div>
              </div>

              {/* Product Metadata */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
                    {item.category === 'jeans' ? 'Trousers' : item.category === 'shirt' ? 'Tops' : 'Outerwear'}
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-cyan-300 transition-colors">
                    {item.product_name}
                  </h3>
                </div>
                <div className="font-mono text-sm text-neutral-300">
                  {item.price}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
