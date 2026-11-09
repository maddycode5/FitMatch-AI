import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Float } from '@react-three/drei';
import BiometricHologramModel from './BiometricHologramModel';

export default function GarmentHeroScene() {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing select-none">
      <Canvas
        camera={{ position: [0, 0.05, 7.7], fov: 40 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* Set deep cyber void background so the glowing cyan hologram pops */}
        <color attach="background" args={['#040711']} />

        {/* Cinematic Cyber Hologram Lighting */}
        <ambientLight intensity={0.6} />
        
        {/* Core Volumetric Cyan Scanner Lights */}
        <pointLight position={[0, 0.6, 2.5]} intensity={4.0} color="#00f0ff" />
        <pointLight position={[0, 1.8, 0]} intensity={3.0} color="#38bdf8" />
        <pointLight position={[-4, 2, -2.5]} intensity={2.5} color="#0ea5e9" />
        <pointLight position={[4, -1, -2.5]} intensity={2.5} color="#0284c7" />

        {/* The Full-Body Biometric Holographic Scanner Pod */}
        <Float speed={0.8} rotationIntensity={0.03} floatIntensity={0.06}>
          <BiometricHologramModel autoRotate={true} />
        </Float>

        {/* Circular Dais Contact Shadow */}
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
          target={[0, 0.05, 0]}
          enablePan={false}
          minDistance={2.2}
          maxDistance={9.5}
          maxPolarAngle={Math.PI / 2 + 0.05}
          minPolarAngle={Math.PI / 4}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}
