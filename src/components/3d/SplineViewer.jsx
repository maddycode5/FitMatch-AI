import React, { useState } from 'react';
import Spline from '@splinetool/react-spline';
import GarmentHeroScene from './GarmentHeroScene';

export default function SplineViewer({ sceneUrl }) {
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no URL or load fails, gracefully fall back to the procedural luxury Three.js studio scene
  if (!sceneUrl || loadError) {
    return <GarmentHeroScene />;
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-luxury-black z-10">
          <div className="text-xs uppercase tracking-[0.3em] text-neutral-400 animate-pulse">
            Calibrating 3D Mannequin...
          </div>
        </div>
      )}
      <Spline
        scene={sceneUrl}
        onLoad={() => setIsLoading(false)}
        onError={() => setLoadError(true)}
      />
    </div>
  );
}
