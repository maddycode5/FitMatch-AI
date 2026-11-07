import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Cyber-Luxury Fashion Avatar & Holographic Fitting Dais
 * Inspired by high-tech virtual fitting avatars with glowing holographic HUDs.
 */
export default function CyberAvatarModel({
  profile,
  tensionMap = {},
  showHeatmap = false,
  viewMode = "both",
  colorway,
  autoRotate = false
}) {
  const avatarGroupRef = useRef();
  const leftScreenRef = useRef();
  const rightScreenRef = useRef();

  useFrame((state, delta) => {
    if (autoRotate && avatarGroupRef.current) {
      avatarGroupRef.current.rotation.y += delta * 0.4;
    }
    // Subtle breathing/floating oscillation on HUD cards
    if (leftScreenRef.current && rightScreenRef.current) {
      const t = state.clock.getElapsedTime();
      leftScreenRef.current.position.y = 0.15 + Math.sin(t * 1.5) * 0.04;
      rightScreenRef.current.position.y = 0.15 + Math.cos(t * 1.5) * 0.04;
    }
  });

  // Parametric scaling from user body measurements
  const baseHeight = 178;
  const baseChest = 98;
  const baseWaist = 82;
  const baseHip = 96;
  const baseShoulder = 45;

  const m = profile?.measurements || {};
  const heightScale = Math.max(0.85, Math.min(1.2, (profile?.height_cm || baseHeight) / baseHeight));
  const chestScale = Math.max(0.8, Math.min(1.3, (m.chest_cm || baseChest) / baseChest));
  const waistScale = Math.max(0.75, Math.min(1.35, (m.waist_cm || baseWaist) / baseWaist));
  const hipScale = Math.max(0.8, Math.min(1.3, (m.hip_cm || baseHip) / baseHip));
  const shoulderScale = Math.max(0.85, Math.min(1.25, (m.shoulder_cm || baseShoulder) / baseShoulder));

  // Tension Heatmap Color Logic
  const getTensionColor = (tension) => {
    if (tension === undefined || tension === null) return '#10b981';
    if (tension < -0.3) return '#f43f5e';
    if (tension < -0.1) return '#fbbf24';
    if (tension > 0.4) return '#38bdf8';
    return '#10b981';
  };

  const chestTension = getTensionColor(tensionMap.chest);
  const waistTension = getTensionColor(tensionMap.waist);
  const hipTension = getTensionColor(tensionMap.hip);

  // Outer coat color (from active product colorway or deep luxury obsidian)
  const coatColor = colorway?.hex && colorway.hex !== '#111113' ? colorway.hex : '#121216';
  const neonCyan = "#38bdf8";
  const neonPink = "#ec4899";

  return (
    <group ref={avatarGroupRef} position={[0, -0.4, 0]}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. GLOWING CIRCULAR GROUND DAIS (PEDESTAL RING)
         ───────────────────────────────────────────────────────────── */}
      <group position={[0, -1.5, 0]}>
        {/* Outer Glowing Neon Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.54, 64]} />
          <meshBasicMaterial color={neonCyan} toneMapped={false} />
        </mesh>
        
        {/* Inner Subtle Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
          <ringGeometry args={[1.1, 1.12, 64]} />
          <meshBasicMaterial color={neonCyan} opacity={0.35} transparent toneMapped={false} />
        </mesh>

        {/* Circular Dark Base Plate */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[1.55, 64]} />
          <meshStandardMaterial color="#0b0b0e" roughness={0.6} metalness={0.7} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────
          2. HOLOGRAPHIC AVATAR BODY (HEAD, NECK, LEGS, SHOES)
         ───────────────────────────────────────────────────────────── */}
      <group scale={[1, heightScale, 1]}>
        
        {/* Head (Sleek Faceless Mannequin with Holographic Translucency) */}
        <mesh position={[0, 1.72, 0]} castShadow>
          <sphereGeometry args={[0.16, 32, 32]} />
          <meshPhysicalMaterial
            color="#60a5fa"
            roughness={0.12}
            metalness={0.2}
            transmission={0.65}
            thickness={0.5}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Inner Holographic Core Wireframe */}
        <mesh position={[0, 1.72, 0]}>
          <sphereGeometry args={[0.155, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" wireframe opacity={0.4} transparent />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.48, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.085, 0.18, 32]} />
          <meshPhysicalMaterial
            color="#60a5fa"
            roughness={0.15}
            transmission={0.6}
            thickness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Metallic Choker / Collar Ornament */}
        <mesh position={[0, 1.43, 0]} castShadow>
          <torusGeometry args={[0.09, 0.012, 16, 32]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Inner Asymmetric Silk Drape Shirt */}
        <mesh position={[0, 0.85, 0.02]} scale={[chestScale * 0.92, 0.65, chestScale * 0.82]} castShadow>
          <cylinderGeometry args={[0.34, 0.38, 0.75, 32]} />
          <meshStandardMaterial
            color="#E2E8F0"
            roughness={0.2}
            metalness={0.4}
          />
        </mesh>

        {/* Tapered Dark Trousers / Joggers */}
        {/* Left Leg */}
        <mesh position={[-0.15, -0.4, 0]} scale={[hipScale * 0.45, 1.15, 0.45]} castShadow>
          <cylinderGeometry args={[0.12, 0.09, 1.35, 32]} />
          <meshStandardMaterial color="#0d0d10" roughness={0.6} />
        </mesh>
        {/* Left Leg Neon Piping */}
        <mesh position={[-0.22, -0.4, 0]}>
          <boxGeometry args={[0.01, 1.3, 0.01]} />
          <meshBasicMaterial color={neonCyan} toneMapped={false} />
        </mesh>

        {/* Right Leg */}
        <mesh position={[0.15, -0.4, 0]} scale={[hipScale * 0.45, 1.15, 0.45]} castShadow>
          <cylinderGeometry args={[0.12, 0.09, 1.35, 32]} />
          <meshStandardMaterial color="#0d0d10" roughness={0.6} />
        </mesh>
        {/* Right Leg Neon Piping */}
        <mesh position={[0.22, -0.4, 0]}>
          <boxGeometry args={[0.01, 1.3, 0.01]} />
          <meshBasicMaterial color={neonCyan} toneMapped={false} />
        </mesh>

        {/* Cyber-Luxury High-Top Sneakers with Glowing Soles */}
        {/* Left Shoe */}
        <group position={[-0.16, -1.18, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.12, 0.28]} />
            <meshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.14, 0.035, 0.3]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} />
          </mesh>
        </group>

        {/* Right Shoe */}
        <group position={[0.16, -1.18, 0.04]}>
          <mesh castShadow>
            <boxGeometry args={[0.13, 0.12, 0.28]} />
            <meshStandardMaterial color="#1a1a22" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <boxGeometry args={[0.14, 0.035, 0.3]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* ─────────────────────────────────────────────────────────────
          3. HAUTE-COUTURE HIGH-TECH OPEN OVERCOAT
         ───────────────────────────────────────────────────────────── */}
      {viewMode !== "mannequin" && (
        <group scale={[shoulderScale * 1.05, heightScale, chestScale * 0.95]} position={[0, 0.65, 0]}>
          
          {/* Main Open Trench Coat Shell */}
          <mesh position={[0, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.42, 0.62, 1.35, 32, 1, true, 0.6, Math.PI * 1.62]} />
            <meshPhysicalMaterial
              color={showHeatmap ? '#18181b' : coatColor}
              roughness={showHeatmap ? 0.3 : 0.35}
              metalness={showHeatmap ? 0.2 : 0.45}
              clearcoat={showHeatmap ? 0.1 : 0.7}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Left Lapel with Cyan/Neon Edge Glow */}
          <mesh position={[-0.24, 0.35, 0.28]} rotation={[0.1, -0.35, -0.05]} castShadow>
            <boxGeometry args={[0.22, 0.55, 0.03]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[-0.34, 0.35, 0.29]} rotation={[0.1, -0.35, -0.05]}>
            <boxGeometry args={[0.015, 0.55, 0.035]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} />
          </mesh>

          {/* Right Lapel with Magenta/Neon Edge Glow */}
          <mesh position={[0.24, 0.35, 0.28]} rotation={[0.1, 0.35, 0.05]} castShadow>
            <boxGeometry args={[0.22, 0.55, 0.03]} />
            <meshStandardMaterial color="#1e1e24" roughness={0.3} metalness={0.6} />
          </mesh>
          <mesh position={[0.34, 0.35, 0.29]} rotation={[0.1, 0.35, 0.05]}>
            <boxGeometry args={[0.015, 0.55, 0.035]} />
            <meshBasicMaterial color={neonPink} toneMapped={false} />
          </mesh>

          {/* Left Sleeve */}
          <mesh position={[-0.48, 0.05, 0]} rotation={[0, 0, 0.15]} castShadow>
            <cylinderGeometry args={[0.12, 0.10, 0.95, 32]} />
            <meshStandardMaterial color={coatColor} roughness={0.35} metalness={0.4} />
          </mesh>

          {/* Right Sleeve */}
          <mesh position={[0.48, 0.05, 0]} rotation={[0, 0, -0.15]} castShadow>
            <cylinderGeometry args={[0.12, 0.10, 0.95, 32]} />
            <meshStandardMaterial color={coatColor} roughness={0.35} metalness={0.4} />
          </mesh>

          {/* High Popped Collar */}
          <mesh position={[0, 0.65, -0.05]} rotation={[0.1, 0, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.24, 0.18, 32, 1, true, 0.8, Math.PI * 1.5]} />
            <meshStandardMaterial color={coatColor} roughness={0.3} side={THREE.DoubleSide} />
          </mesh>

          {/* HEATMAP TENSION HIGHLIGHT OVERLAYS (WHEN ACTIVE) */}
          {showHeatmap && (
            <group>
              {/* Chest Tension Zone */}
              <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[0.43, 0.44, 0.35, 32, 1, true, 0.8, Math.PI * 1.4]} />
                <meshBasicMaterial color={chestTension} side={THREE.DoubleSide} transparent opacity={0.7} />
              </mesh>

              {/* Waist Tension Zone */}
              <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[0.45, 0.48, 0.32, 32, 1, true, 0.8, Math.PI * 1.4]} />
                <meshBasicMaterial color={waistTension} side={THREE.DoubleSide} transparent opacity={0.7} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. FLOATING HOLOGRAPHIC HUD PANELS (FLANKING SIDES, LIKE IMAGE 2)
         ───────────────────────────────────────────────────────────── */}
      
      {/* Left Holographic UI Screen (Garment Specs / Fit Details) */}
      <group ref={leftScreenRef} position={[-1.75, 0.15, 0]} rotation={[0, 0.32, 0]}>
        <Html transform distanceFactor={5.2} className="select-none pointer-events-none">
          <div className="w-56 p-4 rounded-2xl bg-[#0c1018]/80 backdrop-blur-2xl border border-sky-400/40 shadow-[0_0_35px_rgba(56,189,248,0.25)] text-white space-y-3">
            <div className="flex items-center justify-between border-b border-sky-400/20 pb-2">
              <span className="text-[10px] font-mono tracking-widest text-sky-400 uppercase font-semibold">
                Atelier 3D • Garment
              </span>
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-serif font-medium text-white">Sculpted Trench</div>
              <div className="text-[10px] font-mono text-neutral-400">420 GSM Silk-Wool</div>
            </div>

            <div className="space-y-2 pt-1 border-t border-white/5 text-[11px] font-mono">
              <div className="flex justify-between text-neutral-300">
                <span>Shoulder Width:</span>
                <span className="text-sky-300 font-semibold">{m.shoulder_cm || 45} cm</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Chest Girth:</span>
                <span className="text-sky-300 font-semibold">{m.chest_cm || 98} cm</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Waistline:</span>
                <span className="text-sky-300 font-semibold">{m.waist_cm || 82} cm</span>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-sky-950/40 border border-sky-500/20 text-[10px] font-mono text-sky-300 flex items-center justify-between">
              <span>Fit Confidence</span>
              <span className="font-bold">99.4%</span>
            </div>
          </div>
        </Html>
      </group>

      {/* Right Holographic UI Screen (Biometric Depth Radar / Sizing) */}
      <group ref={rightScreenRef} position={[1.75, 0.15, 0]} rotation={[0, -0.32, 0]}>
        <Html transform distanceFactor={5.2} className="select-none pointer-events-none">
          <div className="w-56 p-4 rounded-2xl bg-[#0c1018]/80 backdrop-blur-2xl border border-pink-400/40 shadow-[0_0_35px_rgba(236,72,153,0.25)] text-white space-y-3">
            <div className="flex items-center justify-between border-b border-pink-400/20 pb-2">
              <span className="text-[10px] font-mono tracking-widest text-pink-400 uppercase font-semibold">
                Biometric Scanner
              </span>
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
            </div>

            {/* Depth Telemetry Gauge */}
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between text-neutral-300">
                <span>Shoulder Ease:</span>
                <span className="text-emerald-400 font-bold">+1.5 cm</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[94%]" />
              </div>

              <div className="flex justify-between text-neutral-300 pt-1">
                <span>Chest Drape:</span>
                <span className="text-emerald-400 font-bold">+8.2 cm</span>
              </div>
              <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full w-[88%]" />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-pink-950/40 border border-pink-500/20 text-[10px] font-mono text-pink-300 flex items-center justify-between">
              <span>Recommended Size</span>
              <span className="font-bold text-white">Size 40R (M)</span>
            </div>
          </div>
        </Html>
      </group>

    </group>
  );
}

