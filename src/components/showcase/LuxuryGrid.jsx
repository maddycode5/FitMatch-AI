import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const products = [
  {
    id: 1,
    title: 'Monochrome Cashmere Blazer',
    category: 'Outerwear',
    price: 'EUR 1,650',
    matchScore: '99.8%',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 2,
    title: 'Sculptural Asymmetric Drape Shirt',
    category: 'Tops',
    price: 'EUR 620',
    matchScore: '98.5%',
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 3,
    title: 'Pleated Minimalist Pantalon',
    category: 'Trousers',
    price: 'EUR 840',
    matchScore: '99.1%',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
  }
];

export default function LuxuryGrid() {
  return (
    <section id="collection" className="w-full py-24 px-6 bg-[#0A0A0A]">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-14 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-neutral-400 font-mono">
              The Virtual Archive
            </span>
            <h2 className="font-serif text-4xl text-white font-normal mt-2">
              Curated for your morphology
            </h2>
          </div>
          <button className="text-xs uppercase tracking-[0.2em] text-neutral-400 hover:text-white flex items-center gap-1 transition-colors">
            View All Garments <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              {/* Image Frame with Aspect Ratio */}
              <div className="w-full aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden relative mb-4 border border-white/5">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* 3D Fit Badge */}
                <div className="absolute top-4 left-4 glass-pill px-3 py-1 rounded-full text-[10px] font-mono text-white">
                  Match: {item.matchScore}
                </div>
              </div>

              {/* Product Metadata */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mb-1">
                    {item.category}
                  </div>
                  <h3 className="font-serif text-lg text-white group-hover:text-neutral-300 transition-colors">
                    {item.title}
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
