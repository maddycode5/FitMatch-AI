import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Biometric Hologram & Dynamic Wardrobe Try-On Engine
 * 
 * 1. Accurately renders the customer's full-body biometric avatar inside the laser scanner pod.
 * 2. When wardrobe try-on is active, dynamically generates and drapes the exact clothing piece
 *    (T-Shirt, Silk Shirt, Structured Blazer, Minimalist Trench, or Selvedge Jeans) conforming
 *    to the user's morphology and selected size.
 * 3. Changes textile fabric color and weave luster in real time based on user-selected swatch.
 * 4. Shows precision fit caliper bands and tension heatmaps across the worn garment.
 */
export default function BiometricHologramModel({
  profile,
  product,
  colorway,
  tensionMap = {},
  wearGarment = true,
  showHeatmap = false,
  showFitBands = true,
  autoRotate = false
}) {
  const groupRef = useRef();
  const scanLineRef = useRef();
  const reticleRef = useRef();
  const heartGlowRef = useRef();
  const navelGlowRef = useRef();

  // Calibration baseline dimensions (cm)
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

  // Neon Holographic Colors
  const neonCyan = "#00f0ff";
  const neonElectric = "#38bdf8";

  // Heatmap Tension Colors
  const getTensionColor = (tension) => {
    if (tension === undefined || tension === null) return '#10b981'; // optimal ease
    if (tension < -0.3) return '#f43f5e'; // strained / tight
    if (tension < -0.1) return '#fbbf24'; // snug
    if (tension > 0.4) return '#38bdf8'; // loose
    return '#10b981';
  };

  const chestTension = getTensionColor(tensionMap.chest);
  const waistTension = getTensionColor(tensionMap.waist);
  const hipTension = getTensionColor(tensionMap.hip);

  // Active Fabric Color from Wardrobe Swatch
  const fabricColor = colorway?.hex || (product?.colorways?.[0]?.hex) || '#111113';
  const fabricRoughness = colorway?.roughness ?? 0.35;
  const fabricMetalness = colorway?.metalness ?? 0.45;
  const fabricClearcoat = colorway?.clearcoat ?? 0.65;

  // Real-time animation loop
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();

    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }

    if (scanLineRef.current) {
      scanLineRef.current.position.y = Math.sin(t * 1.6) * 1.45 + 0.15;
    }

    if (reticleRef.current) {
      reticleRef.current.rotation.z += delta * 1.5;
    }

    if (heartGlowRef.current) {
      const pulse = 1.0 + Math.sin(t * 4.0) * 0.15;
      heartGlowRef.current.scale.set(pulse, pulse, pulse);
    }
    if (navelGlowRef.current) {
      const pulse = 1.0 + Math.cos(t * 3.5) * 0.12;
      navelGlowRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  // Human body morphology splines
  const { torsoGeometry, headGeometry, legGeometry, armGeometry } = useMemo(() => {
    const torsoPoints = [
      new THREE.Vector2(0.12, 1.22),
      new THREE.Vector2(0.24, 1.15),
      new THREE.Vector2(0.42, 1.05),
      new THREE.Vector2(0.48, 0.98),
      new THREE.Vector2(0.45, 0.82),
      new THREE.Vector2(0.46, 0.68),
      new THREE.Vector2(0.40, 0.48),
      new THREE.Vector2(0.33, 0.28),
      new THREE.Vector2(0.35, 0.08),
      new THREE.Vector2(0.44, -0.15),
      new THREE.Vector2(0.48, -0.38),
      new THREE.Vector2(0.44, -0.58),
      new THREE.Vector2(0.24, -0.68),
      new THREE.Vector2(0.08, -0.72)
    ];
    const torso = new THREE.LatheGeometry(new THREE.SplineCurve(torsoPoints).getPoints(54), 48);

    const headPoints = [
      new THREE.Vector2(0.00, 1.72),
      new THREE.Vector2(0.12, 1.70),
      new THREE.Vector2(0.18, 1.62),
      new THREE.Vector2(0.19, 1.50),
      new THREE.Vector2(0.16, 1.38),
      new THREE.Vector2(0.09, 1.28),
      new THREE.Vector2(0.00, 1.25)
    ];
    const head = new THREE.LatheGeometry(new THREE.SplineCurve(headPoints).getPoints(32), 36);

    const legPoints = [
      new THREE.Vector2(0.16, 0.00),
      new THREE.Vector2(0.14, -0.25),
      new THREE.Vector2(0.11, -0.48),
      new THREE.Vector2(0.12, -0.68),
      new THREE.Vector2(0.08, -0.95),
      new THREE.Vector2(0.05, -1.02),
      new THREE.Vector2(0.00, -1.02)
    ];
    const leg = new THREE.LatheGeometry(new THREE.SplineCurve(legPoints).getPoints(36), 32);

    const armPoints = [
      new THREE.Vector2(0.10, 0.00),
      new THREE.Vector2(0.08, -0.22),
      new THREE.Vector2(0.065, -0.42),
      new THREE.Vector2(0.07, -0.58),
      new THREE.Vector2(0.045, -0.78),
      new THREE.Vector2(0.00, -0.80)
    ];
    const arm = new THREE.LatheGeometry(new THREE.SplineCurve(armPoints).getPoints(32), 24);

    return { torsoGeometry: torso, headGeometry: head, legGeometry: leg, armGeometry: arm };
  }, []);

  // Dynamic Garment Geometries for Each Wardrobe Category
  const { tshirtBodyGeo, shirtBodyGeo, blazerBodyGeo, trenchBodyGeo, lapelGeo } = useMemo(() => {
    // 1. Crewneck T-Shirt Body
    const tshirtPoints = [
      new THREE.Vector2(0.18, 1.10),
      new THREE.Vector2(0.36, 1.04),
      new THREE.Vector2(0.50, 0.96),
      new THREE.Vector2(0.48, 0.78),
      new THREE.Vector2(0.46, 0.52),
      new THREE.Vector2(0.42, 0.26),
      new THREE.Vector2(0.43, 0.02),
      new THREE.Vector2(0.45, -0.10)
    ];
    const tshirt = new THREE.LatheGeometry(new THREE.SplineCurve(tshirtPoints).getPoints(36), 40);

    // 2. Button-Down Silk Shirt Body
    const shirtPoints = [
      new THREE.Vector2(0.16, 1.14),
      new THREE.Vector2(0.35, 1.06),
      new THREE.Vector2(0.50, 0.98),
      new THREE.Vector2(0.47, 0.76),
      new THREE.Vector2(0.45, 0.50),
      new THREE.Vector2(0.40, 0.24),
      new THREE.Vector2(0.42, -0.02),
      new THREE.Vector2(0.45, -0.22)
    ];
    const shirt = new THREE.LatheGeometry(new THREE.SplineCurve(shirtPoints).getPoints(36), 40);

    // 3. Tailored Blazer Body
    const blazerPoints = [
      new THREE.Vector2(0.17, 1.16),
      new THREE.Vector2(0.36, 1.08),
      new THREE.Vector2(0.52, 0.98),
      new THREE.Vector2(0.50, 0.74),
      new THREE.Vector2(0.48, 0.48),
      new THREE.Vector2(0.43, 0.22),
      new THREE.Vector2(0.46, -0.04),
      new THREE.Vector2(0.50, -0.28)
    ];
    const blazer = new THREE.LatheGeometry(new THREE.SplineCurve(blazerPoints).getPoints(40), 44);

    // 4. Minimalist Trench Overcoat Body
    const trenchPoints = [
      new THREE.Vector2(0.19, 1.18),
      new THREE.Vector2(0.38, 1.10),
      new THREE.Vector2(0.54, 0.98),
      new THREE.Vector2(0.52, 0.72),
      new THREE.Vector2(0.50, 0.46),
      new THREE.Vector2(0.45, 0.20),
      new THREE.Vector2(0.48, -0.08),
      new THREE.Vector2(0.56, -0.38),
      new THREE.Vector2(0.64, -0.68)
    ];
    const trench = new THREE.LatheGeometry(new THREE.SplineCurve(trenchPoints).getPoints(44), 48);

    // Tailored Lapel Shape
    const lapelShape = new THREE.Shape();
    lapelShape.moveTo(0, 0);
    lapelShape.lineTo(0.18, 0.14);
    lapelShape.lineTo(0.26, 0.38);
    lapelShape.lineTo(0.11, 0.50);
    lapelShape.lineTo(0.01, 0.46);
    lapelShape.closePath();
    const lapel = new THREE.ExtrudeGeometry(lapelShape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008 });

    return { tshirtBodyGeo: tshirt, shirtBodyGeo: shirt, blazerBodyGeo: blazer, trenchBodyGeo: trench, lapelGeo: lapel };
  }, []);

  // Cylindrical laser pod beams
  const laserBeams = useMemo(() => {
    const beams = [];
    const count = 22;
    const radius = 1.45;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      beams.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
      });
    }
    return beams;
  }, []);

  const category = product?.category || 'jacket';
  const prodId = product?.id || 'PROD_TRENCH_01';

  return (
    <group ref={groupRef} position={[0, -0.15, 0]}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. CYLINDRICAL HOLOGRAPHIC SCANNING POD
         ───────────────────────────────────────────────────────────── */}
      {/* Top Emitter Ring */}
      <group position={[0, 1.85, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.42, 1.48, 64]} />
          <meshBasicMaterial color={neonCyan} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[1.38, 1.52, 64]} />
          <meshBasicMaterial color="#ffffff" opacity={0.65} transparent toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.04, 0]}>
          <cylinderGeometry args={[1.45, 1.45, 0.08, 48, 1, true]} />
          <meshBasicMaterial color={neonCyan} opacity={0.3} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Bottom Concentric Hologram Dais */}
      <group position={[0, -1.75, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.42, 1.48, 64]} />
          <meshBasicMaterial color={neonCyan} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[1.15, 1.18, 64]} />
          <meshBasicMaterial color={neonElectric} opacity={0.7} transparent toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.82, 0.85, 48]} />
          <meshBasicMaterial color={neonCyan} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.42, 0.44, 32]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <circleGeometry args={[1.52, 64]} />
          <meshBasicMaterial color="#030712" />
        </mesh>
      </group>

      {/* Vertical Laser Pod Rods */}
      {laserBeams.map((beam, idx) => (
        <mesh key={idx} position={[beam.x, 0.05, beam.z]}>
          <cylinderGeometry args={[0.003, 0.003, 3.6, 8]} />
          <meshBasicMaterial color={neonCyan} opacity={0.4} transparent toneMapped={false} />
        </mesh>
      ))}

      {/* Sweeping Horizontal Laser Scan Plane */}
      <group ref={scanLineRef} position={[0, 0, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.08, 1.44, 64]} />
          <meshBasicMaterial color={neonCyan} opacity={0.22} transparent side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.40, 1.44, 64]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      </group>

      {/* ─────────────────────────────────────────────────────────────
          2. ANATOMICAL NEURAL HUMAN AVATAR (REAL-TIME MORPHOLOGY)
         ───────────────────────────────────────────────────────────── */}
      <group scale={[1, heightScale, 1]} position={[0, 0.05, 0]}>
        
        {/* Cranial Head */}
        <mesh geometry={headGeometry} castShadow>
          <meshBasicMaterial color={neonCyan} wireframe opacity={0.65} transparent />
        </mesh>
        <mesh geometry={headGeometry}>
          <meshPhysicalMaterial
            color="#0ea5e9"
            emissive="#0284c7"
            emissiveIntensity={0.65}
            roughness={0.15}
            transmission={0.78}
            thickness={0.6}
            transparent
            opacity={0.55}
          />
        </mesh>

        {/* Torso & Ribcage */}
        <group scale={[shoulderScale * 1.02, 1, chestScale * 0.82]}>
          <mesh geometry={torsoGeometry} castShadow>
            <meshBasicMaterial
              color={showHeatmap ? chestTension : neonCyan}
              wireframe
              opacity={wearGarment && category !== 'jeans' ? 0.25 : 0.65}
              transparent
            />
          </mesh>
          <mesh geometry={torsoGeometry}>
            <meshPhysicalMaterial
              color={showHeatmap ? chestTension : "#0284c7"}
              emissive={showHeatmap ? chestTension : "#0369a1"}
              emissiveIntensity={showHeatmap ? 0.85 : 0.55}
              roughness={0.15}
              transmission={0.78}
              thickness={0.8}
              transparent
              opacity={wearGarment && category !== 'jeans' ? 0.20 : 0.5}
            />
          </mesh>
        </group>

        {/* Luminous Heart Core */}
        <group position={[0, 0.72, 0.20]} ref={heartGlowRef}>
          <mesh>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshBasicMaterial
              color={showHeatmap ? chestTension : neonCyan}
              opacity={0.5}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Luminous Solar Plexus Core */}
        <group position={[0, 0.32, 0.17]} ref={navelGlowRef}>
          <mesh>
            <sphereGeometry args={[0.06, 24, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.14, 24, 24]} />
            <meshBasicMaterial
              color={showHeatmap ? waistTension : neonCyan}
              opacity={0.5}
              transparent
              toneMapped={false}
            />
          </mesh>
        </group>

        {/* Constellation Landmark Nodes */}
        {[
          [-0.42 * shoulderScale, 1.02, 0.05],
          [0.42 * shoulderScale, 1.02, 0.05],
          [-0.48 * shoulderScale, 0.60, 0.02],
          [0.48 * shoulderScale, 0.60, 0.02],
          [-0.50 * shoulderScale, 0.22, 0.02],
          [0.50 * shoulderScale, 0.22, 0.02],
          [-0.26 * waistScale, 0.28, 0.12],
          [0.26 * waistScale, 0.28, 0.12],
          [-0.34 * hipScale, -0.15, 0.10],
          [0.34 * hipScale, -0.15, 0.10],
          [-0.21 * hipScale, -0.62, 0.08],
          [0.21 * hipScale, -0.62, 0.08],
          [-0.18 * hipScale, -1.18, 0.05],
          [0.18 * hipScale, -1.18, 0.05]
        ].map((pos, idx) => (
          <group key={idx} position={pos}>
            <mesh>
              <sphereGeometry args={[0.026, 16, 16]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.055, 16, 16]} />
              <meshBasicMaterial color={neonCyan} opacity={0.65} transparent toneMapped={false} />
            </mesh>
          </group>
        ))}

        {/* Arms & Hands */}
        <group position={[-0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, 0.14]}>
          <mesh geometry={armGeometry}>
            <meshBasicMaterial color={neonCyan} wireframe opacity={0.6} transparent />
          </mesh>
          <mesh geometry={armGeometry}>
            <meshPhysicalMaterial color="#0ea5e9" transmission={0.7} roughness={0.2} transparent opacity={0.4} />
          </mesh>
        </group>
        <group position={[0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, -0.14]}>
          <mesh geometry={armGeometry}>
            <meshBasicMaterial color={neonCyan} wireframe opacity={0.6} transparent />
          </mesh>
          <mesh geometry={armGeometry}>
            <meshPhysicalMaterial color="#0ea5e9" transmission={0.7} roughness={0.2} transparent opacity={0.4} />
          </mesh>
        </group>

        {/* Legs & Feet */}
        <group position={[-0.21 * hipScale, -0.22, 0]}>
          <mesh geometry={legGeometry}>
            <meshBasicMaterial
              color={showHeatmap ? hipTension : neonCyan}
              wireframe
              opacity={wearGarment && category === 'jeans' ? 0.25 : 0.65}
              transparent
            />
          </mesh>
          <mesh geometry={legGeometry}>
            <meshPhysicalMaterial
              color={showHeatmap ? hipTension : "#0ea5e9"}
              transmission={0.72}
              roughness={0.2}
              transparent
              opacity={wearGarment && category === 'jeans' ? 0.25 : 0.45}
            />
          </mesh>
          <mesh position={[0, -1.05, 0.08]}>
            <boxGeometry args={[0.09, 0.04, 0.22]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} opacity={0.8} transparent />
          </mesh>
        </group>

        <group position={[0.21 * hipScale, -0.22, 0]}>
          <mesh geometry={legGeometry}>
            <meshBasicMaterial
              color={showHeatmap ? hipTension : neonCyan}
              wireframe
              opacity={wearGarment && category === 'jeans' ? 0.25 : 0.65}
              transparent
            />
          </mesh>
          <mesh geometry={legGeometry}>
            <meshPhysicalMaterial
              color={showHeatmap ? hipTension : "#0ea5e9"}
              transmission={0.72}
              roughness={0.2}
              transparent
              opacity={wearGarment && category === 'jeans' ? 0.25 : 0.45}
            />
          </mesh>
          <mesh position={[0, -1.05, 0.08]}>
            <boxGeometry args={[0.09, 0.04, 0.22]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} opacity={0.8} transparent />
          </mesh>
        </group>

        {/* Interactive Touch Target Reticle */}
        <group ref={reticleRef} position={[-0.52 * shoulderScale, 1.05, 0.25]}>
          <mesh>
            <ringGeometry args={[0.08, 0.095, 32]} />
            <meshBasicMaterial color={neonCyan} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.13, 0.145, 32]} />
            <meshBasicMaterial color={neonCyan} opacity={0.6} transparent side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.04, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>

        {/* ─────────────────────────────────────────────────────────────
            3. DYNAMIC WARDROBE TRY-ON (CONFORMS TO REAL-TIME MORPHOLOGY)
           ───────────────────────────────────────────────────────────── */}
        {wearGarment && (
          <group position={[0, 0.10, 0]}>
            
            {/* OPTION A: T-SHIRT */}
            {category === 'tshirt' && (
              <group scale={[shoulderScale * 1.04, heightScale * 0.98, chestScale * 0.86]}>
                {/* T-Shirt Torso */}
                <mesh geometry={tshirtBodyGeo} castShadow receiveShadow>
                  <meshPhysicalMaterial
                    color={showHeatmap ? chestTension : fabricColor}
                    roughness={showHeatmap ? 0.3 : 0.85}
                    metalness={showHeatmap ? 0.2 : 0.08}
                    clearcoat={0.1}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Crewneck Ribbed Collar */}
                <mesh position={[0, 1.10, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.18, 0.022, 16, 32]} />
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.9} />
                </mesh>
                {/* Short Sleeves */}
                <mesh position={[-0.44, 0.86, 0]} rotation={[0, 0, 0.42]}>
                  <cylinderGeometry args={[0.11, 0.10, 0.28, 24, 1, true]} />
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.44, 0.86, 0]} rotation={[0, 0, -0.42]}>
                  <cylinderGeometry args={[0.11, 0.10, 0.28, 24, 1, true]} />
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.85} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}

            {/* OPTION B: SILK SARTORIAL DRESS SHIRT */}
            {category === 'shirt' && (
              <group scale={[shoulderScale * 1.04, heightScale * 0.99, chestScale * 0.86]}>
                {/* Shirt Body */}
                <mesh geometry={shirtBodyGeo} castShadow receiveShadow>
                  <meshPhysicalMaterial
                    color={showHeatmap ? chestTension : fabricColor}
                    roughness={showHeatmap ? 0.25 : 0.22}
                    metalness={showHeatmap ? 0.3 : 0.45}
                    clearcoat={0.85}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Collar Rim */}
                <mesh position={[0, 1.14, 0.02]} rotation={[0.08, 0, 0]}>
                  <cylinderGeometry args={[0.18, 0.22, 0.09, 32, 1, true]} />
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.3} side={THREE.DoubleSide} />
                </mesh>
                {/* Front Button Placket */}
                <mesh position={[0, 0.45, 0.46]}>
                  <boxGeometry args={[0.035, 0.85, 0.015]} />
                  <meshStandardMaterial color="#1a1a20" roughness={0.4} />
                </mesh>
                {/* Long Sleeves with Cuffs */}
                <mesh position={[-0.44, 0.62, 0]} rotation={[0, 0, 0.16]}>
                  <cylinderGeometry args={[0.095, 0.08, 0.72, 24, 1, true]} />
                  <meshPhysicalMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.25} clearcoat={0.8} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.44, 0.62, 0]} rotation={[0, 0, -0.16]}>
                  <cylinderGeometry args={[0.095, 0.08, 0.72, 24, 1, true]} />
                  <meshPhysicalMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.25} clearcoat={0.8} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}

            {/* OPTION C: STRUCTURED BLAZER */}
            {category === 'jacket' && prodId === 'PROD_BLAZER_02' && (
              <group scale={[shoulderScale * 1.06, heightScale * 0.99, chestScale * 0.88]}>
                {/* Blazer Torso */}
                <mesh geometry={blazerBodyGeo} castShadow receiveShadow>
                  <meshPhysicalMaterial
                    color={showHeatmap ? chestTension : fabricColor}
                    roughness={showHeatmap ? 0.3 : fabricRoughness}
                    metalness={showHeatmap ? 0.2 : fabricMetalness}
                    clearcoat={fabricClearcoat}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Notched Lapels */}
                <mesh geometry={lapelGeo} position={[0.02, 0.32, 0.45]} rotation={[0.12, -0.28, -0.06]} castShadow>
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh geometry={lapelGeo} position={[-0.02, 0.32, 0.45]} rotation={[0.12, 0.28, 0.06]} scale={[-1, 1, 1]} castShadow>
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.3} metalness={0.5} />
                </mesh>
                {/* Horn Buttons */}
                <mesh position={[0, 0.32, 0.49]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.018, 0.018, 0.015, 16]} />
                  <meshStandardMaterial color="#0a0a0c" metalness={0.7} />
                </mesh>
                {/* Tailored Sleeves */}
                <mesh position={[-0.45, 0.58, 0]} rotation={[0, 0, 0.16]}>
                  <cylinderGeometry args={[0.10, 0.085, 0.76, 24, 1, true]} />
                  <meshPhysicalMaterial color={showHeatmap ? chestTension : fabricColor} roughness={fabricRoughness} metalness={fabricMetalness} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.45, 0.58, 0]} rotation={[0, 0, -0.16]}>
                  <cylinderGeometry args={[0.10, 0.085, 0.76, 24, 1, true]} />
                  <meshPhysicalMaterial color={showHeatmap ? chestTension : fabricColor} roughness={fabricRoughness} metalness={fabricMetalness} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}

            {/* OPTION D: MINIMALIST SCULPTURAL TRENCH COAT */}
            {category === 'jacket' && prodId !== 'PROD_BLAZER_02' && (
              <group scale={[shoulderScale * 1.08, heightScale, chestScale * 0.90]}>
                {/* Trench Body */}
                <mesh geometry={trenchBodyGeo} castShadow receiveShadow>
                  <meshPhysicalMaterial
                    color={showHeatmap ? chestTension : fabricColor}
                    roughness={showHeatmap ? 0.3 : fabricRoughness}
                    metalness={showHeatmap ? 0.2 : fabricMetalness}
                    clearcoat={fabricClearcoat}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Lapels */}
                <mesh geometry={lapelGeo} position={[0.02, 0.32, 0.46]} rotation={[0.12, -0.28, -0.06]} castShadow>
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.3} metalness={0.5} />
                </mesh>
                <mesh geometry={lapelGeo} position={[-0.02, 0.32, 0.46]} rotation={[0.12, 0.28, 0.06]} scale={[-1, 1, 1]} castShadow>
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.3} metalness={0.5} />
                </mesh>
                {/* Standing Collar */}
                <mesh position={[0, 1.15, 0.02]} rotation={[0.08, 0, 0]}>
                  <cylinderGeometry args={[0.22, 0.26, 0.14, 32, 1, true]} />
                  <meshStandardMaterial color={showHeatmap ? chestTension : fabricColor} roughness={0.3} side={THREE.DoubleSide} />
                </mesh>
                {/* Waist Sash Belt with Brass Buckle */}
                <mesh position={[0, 0.00, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.47, 0.035, 16, 48]} />
                  <meshStandardMaterial color="#1a1a20" roughness={0.3} metalness={0.6} />
                </mesh>
                <mesh position={[0, 0.00, 0.49]}>
                  <boxGeometry args={[0.12, 0.09, 0.025]} />
                  <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
                </mesh>
                {/* Raglan Long Sleeves */}
                <mesh position={[-0.46, 0.52, 0]} rotation={[0, 0, 0.16]}>
                  <cylinderGeometry args={[0.11, 0.09, 0.82, 24, 1, true]} />
                  <meshPhysicalMaterial color={showHeatmap ? chestTension : fabricColor} roughness={fabricRoughness} metalness={fabricMetalness} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0.46, 0.52, 0]} rotation={[0, 0, -0.16]}>
                  <cylinderGeometry args={[0.11, 0.09, 0.82, 24, 1, true]} />
                  <meshPhysicalMaterial color={showHeatmap ? chestTension : fabricColor} roughness={fabricRoughness} metalness={fabricMetalness} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}

            {/* OPTION E: JAPANESE SELVEDGE DENIM JEANS */}
            {category === 'jeans' && (
              <group scale={[hipScale * 1.03, heightScale, hipScale * 1.02]} position={[0, -0.22, 0]}>
                {/* Waistband */}
                <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.42, 0.038, 16, 48]} />
                  <meshStandardMaterial color={showHeatmap ? waistTension : fabricColor} roughness={0.8} metalness={0.2} />
                </mesh>
                {/* Copper Rivet Button */}
                <mesh position={[0, 0.22, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.016, 0.016, 0.02, 16]} />
                  <meshStandardMaterial color="#b87333" metalness={0.9} roughness={0.3} />
                </mesh>
                {/* Pant Legs */}
                <mesh position={[-0.21, -0.42, 0]}>
                  <cylinderGeometry args={[0.145, 0.105, 0.95, 24, 1, true]} />
                  <meshPhysicalMaterial
                    color={showHeatmap ? hipTension : fabricColor}
                    roughness={0.8}
                    metalness={0.2}
                    clearcoat={0.15}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                <mesh position={[0.21, -0.42, 0]}>
                  <cylinderGeometry args={[0.145, 0.105, 0.95, 24, 1, true]} />
                  <meshPhysicalMaterial
                    color={showHeatmap ? hipTension : fabricColor}
                    roughness={0.8}
                    metalness={0.2}
                    clearcoat={0.15}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            )}

          </group>
        )}

        {/* ─────────────────────────────────────────────────────────────
            4. REAL-TIME MORPHOLOGY WEARING & FIT CALIPER BANDS
           ───────────────────────────────────────────────────────────── */}
        {showFitBands && (
          <group>
            {/* Shoulder Caliper Span */}
            <group position={[0, 1.05, 0.05]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.003, 0.003, 0.88 * shoulderScale, 8]} />
                <meshBasicMaterial color={neonCyan} toneMapped={false} />
              </mesh>
            </group>

            {/* Chest Fit Band */}
            <group position={[0, 0.72, 0]} scale={[shoulderScale * 0.98, 1, chestScale * 0.86]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.49, 0.012, 16, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? chestTension : neonCyan}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.46, 0.54, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? chestTension : neonCyan}
                  transparent
                  opacity={0.25}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>

            {/* Waist Fit Band */}
            <group position={[0, 0.28, 0]} scale={[waistScale * 0.96, 1, waistScale * 0.88]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.38, 0.012, 16, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? waistTension : neonElectric}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.35, 0.42, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? waistTension : neonElectric}
                  transparent
                  opacity={0.25}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>

            {/* Hip Fit Band */}
            <group position={[0, -0.15, 0]} scale={[hipScale * 1.02, 1, hipScale * 0.92]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.47, 0.012, 16, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? hipTension : neonCyan}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.44, 0.52, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? hipTension : neonCyan}
                  transparent
                  opacity={0.25}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>
          </group>
        )}

      </group>

    </group>
  );
}
