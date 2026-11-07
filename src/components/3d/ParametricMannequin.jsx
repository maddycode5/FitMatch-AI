import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import BiometricHologramModel from './BiometricHologramModel';

export default function ParametricMannequin({
  profile,
  product,
  selectedSize,
  tensionMap,
  colorway,
  wearGarment = true,
  showHeatmap = false,
  showFitBands = true,
  autoRotate = false
}) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none bg-[#040711]">
      <Canvas
        camera={{ position: [0, 0.15, 4.8], fov: 40 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#040711']} />

        {/* Cinematic Cyber Hologram Lighting */}
        <ambientLight intensity={0.7} />
        
        {/* Core Volumetric Cyan Scanner Lights */}
        <pointLight position={[0, 0.5, 2.5]} intensity={4.2} color="#00f0ff" />
        <pointLight position={[0, 1.8, 0]} intensity={3.0} color="#38bdf8" />
        <pointLight position={[0, -0.8, -2.5]} intensity={2.6} color="#0284c7" />
        <directionalLight position={[0, 2, 4]} intensity={1.2} color="#ffffff" />

        {/* The Full-Body Biometric Avatar with Dynamic Wardrobe Try-On */}
        <Float speed={0.8} rotationIntensity={0.03} floatIntensity={0.06}>
          <BiometricHologramModel
            profile={profile}
            product={product}
            tensionMap={tensionMap}
            colorway={colorway}
            wearGarment={wearGarment}
            showHeatmap={showHeatmap}
            showFitBands={showFitBands}
            autoRotate={autoRotate}
          />
        </Float>

        {/* Circular Floor Dais Shadow */}
        <ContactShadows
          position={[0, -1.82, 0]}
          opacity={0.9}
          scale={5.8}
          blur={1.8}
          far={3.0}
          color="#00f0ff"
        />

        {/* Interactive 360 Orbit Controls */}
        <OrbitControls
          enablePan={false}
          minDistance={2.4}
          maxDistance={7.0}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minPolarAngle={Math.PI / 4}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
