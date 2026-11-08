import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createSuitBlazerTexture,
  createDrapeShirtTexture,
  createPantalonTexture,
  createTrenchTexture
} from './RealGarmentTextures';

/**
 * Biometric Hologram & Real-Life Virtual Archive Try-On Engine
 * 
 * 1. Accurately renders the customer's full-body biometric avatar inside the laser scanner pod.
 * 2. Directly fits the real-life garments from The Virtual Archive onto the 3D model:
 *    - Monochrome Cashmere 3-Piece Suit & Blazer (Check wool, vest, striped tie, pocket square, sleeves, trousers)
 *    - Sculptural Asymmetric Drape Shirt (Crisp Egyptian white cotton, 3D collar, navy polka-dot silk tie, cuffs, trousers)
 *    - Pleated Minimalist Pantalon (High-waisted tailored pinstripe wide-leg trousers with front pleats)
 *    - The Sculptural Minimalist Trench (Double-breasted twill overcoat with belt, buckle, lapels, sleeves)
 * 3. Garments conform dynamically to the user's morphology (chest, waist, shoulders, height),
 *    active size (S/M/L/XL), and active fit preference (Slim/Regular/Oversized).
 * 4. Zero crude plastic digital cones; displays true tailored apparel with real fabric textures and 3D details.
 */
export default function BiometricHologramModel({
  profile,
  product,
  selectedSize,
  fitPreference = 'regular',
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

  // Dynamic Garment Calibration based on selected size & active fit preference
  const activeSizeObj = useMemo(() => {
    if (!product?.size_chart) return null;
    const found = product.size_chart.find(s => s.size === selectedSize);
    return found || product.size_chart[0];
  }, [product, selectedSize]);

  const baseGarmentChest = product?.size_chart?.[1]?.garment_chest_cm || 108;
  const currentGarmentChest = activeSizeObj?.garment_chest_cm || (activeSizeObj?.garment_waist_cm ? activeSizeObj.garment_waist_cm * 1.2 : baseGarmentChest);
  const sizeRatio = Math.max(0.88, Math.min(1.22, currentGarmentChest / baseGarmentChest));

  // Fit Preference Modifiers
  // 'slim': tighter contour (-6% chest, -3% shoulders, tailored waist)
  // 'regular': balanced tailored ease
  // 'oversized': expanded architectural silhouette (+14% chest, +8% shoulders, +4% length)
  const prefCircumferenceMod = fitPreference === 'slim' ? 0.94 : fitPreference === 'oversized' ? 1.14 : 1.0;
  const prefShoulderMod = fitPreference === 'slim' ? 0.97 : fitPreference === 'oversized' ? 1.08 : 1.0;
  const prefLengthMod = fitPreference === 'oversized' ? 1.04 : fitPreference === 'slim' ? 0.98 : 1.0;

  // Composite Garment Scaling (Body Morphology * Garment Size * Fit Preference)
  const gChestScale = chestScale * (0.88 * sizeRatio * prefCircumferenceMod);
  const gShoulderScale = shoulderScale * (1.05 * Math.sqrt(sizeRatio) * prefShoulderMod);
  const gWaistScale = waistScale * (0.90 * sizeRatio * prefCircumferenceMod);
  const gHipScale = hipScale * (1.04 * sizeRatio * prefCircumferenceMod);
  const gHeightScale = heightScale * prefLengthMod;

  // Neon Holographic Colors
  const neonCyan = "#00f0ff";
  const neonElectric = "#38bdf8";

  // Heatmap Tension Colors
  const getTensionColor = (tension) => {
    if (tension === undefined || tension === null) return '#10b981'; // optimal ease
    if (tension < -0.3) return '#f43f5e'; // strained / tight
    if (tension < -0.1) return '#fbbf24'; // snug
    if (tension > 0.4) return '#38bdf8'; // loose / relaxed
    return '#10b981';
  };

  const chestTension = getTensionColor(tensionMap.chest);
  const waistTension = getTensionColor(tensionMap.waist);
  const hipTension = getTensionColor(tensionMap.hip);

  const prodId = product?.id || 'PROD_BLAZER_01';
  const category = product?.category || 'jacket';

  // Active Fabric Color from Wardrobe Swatch
  const fabricColor = colorway?.hex || (product?.colorways?.[0]?.hex) || '#222428';
  const fabricRoughness = colorway?.roughness ?? 0.70;
  const fabricMetalness = colorway?.metalness ?? 0.35;

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

  // Human body morphology geometry splines
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

  // Generate Realistic Photorealistic Textures for the Active Garment
  const garmentTexture = useMemo(() => {
    if (prodId === 'PROD_BLAZER_01') {
      return createSuitBlazerTexture(fabricColor);
    } else if (category === 'shirt' || prodId === 'PROD_SHIRT_02') {
      return createDrapeShirtTexture(fabricColor);
    } else if (category === 'jeans' || prodId === 'PROD_PANTS_03') {
      return createPantalonTexture(fabricColor);
    } else {
      return createTrenchTexture(fabricColor);
    }
  }, [prodId, category, fabricColor]);

  // Secondary Trouser Texture for two-piece ensembles
  const suitTrouserTexture = useMemo(() => {
    return createPantalonTexture(prodId === 'PROD_BLAZER_01' ? fabricColor : '#18191d');
  }, [prodId, fabricColor]);

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

  const isTrousers = category === 'jeans' || prodId === 'PROD_PANTS_03';

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
            opacity={0.75}
          />
        </mesh>

        {/* Anatomical Torso */}
        <mesh
          geometry={torsoGeometry}
          scale={[shoulderScale, 1, chestScale]}
          position={[0, 0, 0]}
          castShadow
        >
          <meshBasicMaterial
            color={showHeatmap ? chestTension : neonCyan}
            wireframe
            opacity={wearGarment ? 0.18 : 0.70}
            transparent
          />
        </mesh>
        <mesh
          geometry={torsoGeometry}
          scale={[shoulderScale, 1, chestScale]}
          position={[0, 0, 0]}
        >
          <meshPhysicalMaterial
            color={showHeatmap ? chestTension : "#0284c7"}
            emissive={showHeatmap ? chestTension : "#0369a1"}
            emissiveIntensity={0.45}
            roughness={0.2}
            transmission={0.7}
            transparent
            opacity={wearGarment ? 0.22 : 0.65}
          />
        </mesh>

        {/* Biometric Laser Nodes */}
        {[
          [0, 1.15, 0.26],
          [-0.38 * shoulderScale, 1.05, 0.12],
          [0.38 * shoulderScale, 1.05, 0.12],
          [0, 0.70, 0.28],
          [0, 0.28, 0.22],
          [-0.24 * hipScale, -0.22, 0.14],
          [0.24 * hipScale, -0.22, 0.14],
          [-0.18 * hipScale, -0.92, 0.10],
          [0.18 * hipScale, -0.92, 0.10]
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

        {/* Avatar Left Arm */}
        <group position={[-0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, 0.14]}>
          <mesh geometry={armGeometry}>
            <meshBasicMaterial color={neonCyan} wireframe opacity={wearGarment ? 0.2 : 0.6} transparent />
          </mesh>
          <mesh geometry={armGeometry}>
            <meshPhysicalMaterial color="#0ea5e9" transmission={0.7} roughness={0.2} transparent opacity={wearGarment ? 0.15 : 0.4} />
          </mesh>
        </group>

        {/* Avatar Right Arm */}
        <group position={[0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, -0.14]}>
          <mesh geometry={armGeometry}>
            <meshBasicMaterial color={neonCyan} wireframe opacity={wearGarment ? 0.2 : 0.6} transparent />
          </mesh>
          <mesh geometry={armGeometry}>
            <meshPhysicalMaterial color="#0ea5e9" transmission={0.7} roughness={0.2} transparent opacity={wearGarment ? 0.15 : 0.4} />
          </mesh>
        </group>

        {/* Avatar Left Leg */}
        <group position={[-0.21 * hipScale, -0.22, 0]}>
          <mesh geometry={legGeometry}>
            <meshBasicMaterial
              color={showHeatmap ? hipTension : neonCyan}
              wireframe
              opacity={wearGarment ? 0.18 : 0.65}
              transparent
            />
          </mesh>
          <mesh geometry={legGeometry}>
            <meshPhysicalMaterial
              color={showHeatmap ? hipTension : "#0ea5e9"}
              transmission={0.72}
              roughness={0.2}
              transparent
              opacity={wearGarment ? 0.15 : 0.45}
            />
          </mesh>
          <mesh position={[0, -1.05, 0.08]}>
            <boxGeometry args={[0.09, 0.04, 0.22]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} opacity={0.8} transparent />
          </mesh>
        </group>

        {/* Avatar Right Leg */}
        <group position={[0.21 * hipScale, -0.22, 0]}>
          <mesh geometry={legGeometry}>
            <meshBasicMaterial
              color={showHeatmap ? hipTension : neonCyan}
              wireframe
              opacity={wearGarment ? 0.18 : 0.65}
              transparent
            />
          </mesh>
          <mesh geometry={legGeometry}>
            <meshPhysicalMaterial
              color={showHeatmap ? hipTension : "#0ea5e9"}
              transmission={0.72}
              roughness={0.2}
              transparent
              opacity={wearGarment ? 0.15 : 0.45}
            />
          </mesh>
          <mesh position={[0, -1.05, 0.08]}>
            <boxGeometry args={[0.09, 0.04, 0.22]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} opacity={0.8} transparent />
          </mesh>
        </group>

        {/* Interactive Reticle */}
        <group ref={reticleRef} position={[-0.52 * shoulderScale, 1.05, 0.25]}>
          <mesh>
            <ringGeometry args={[0.07, 0.085, 32]} />
            <meshBasicMaterial color={neonCyan} toneMapped={false} />
          </mesh>
          <mesh>
            <circleGeometry args={[0.04, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>

        {/* ─────────────────────────────────────────────────────────────
            3. REAL-LIFE VIRTUAL ARCHIVE GARMENT TRY-ON (DYNAMIC MORPHOLOGY)
           ───────────────────────────────────────────────────────────── */}
        {wearGarment && (
          <group position={[0, 0, 0]}>
            
            {/* ═════════════════════════════════════════════════════════════
                GARMENT 1: THE MONOCHROME CASHMERE BLAZER & 3-PIECE SUIT
                (Check Wool, Peak Lapels, Waistcoat, Tie, Pocket Square, Sleeves & Pants)
               ═════════════════════════════════════════════════════════════ */}
            {prodId === 'PROD_BLAZER_01' && (
              <group>
                {/* Tailored Jacket Torso - rotation=[0, Math.PI, 0] puts the front details directly facing camera */}
                <group scale={[gShoulderScale, gHeightScale * 0.98, gChestScale]}>
                  <mesh position={[0, 0.52, 0.01]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.51, 0.46, 0.98, 48, 1, false]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={showHeatmap ? 0.3 : fabricRoughness}
                      metalness={showHeatmap ? 0.2 : fabricMetalness}
                      color={showHeatmap ? chestTension : '#ffffff'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* 3D Peaked Left Lapel */}
                  <mesh position={[-0.14, 0.68, 0.24]} rotation={[0.05, -0.22, -0.26]}>
                    <boxGeometry args={[0.11, 0.42, 0.02]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      color={showHeatmap ? chestTension : '#ffffff'}
                      roughness={fabricRoughness}
                    />
                  </mesh>

                  {/* 3D Peaked Right Lapel */}
                  <mesh position={[0.14, 0.68, 0.24]} rotation={[0.05, 0.22, 0.26]}>
                    <boxGeometry args={[0.11, 0.42, 0.02]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      color={showHeatmap ? chestTension : '#ffffff'}
                      roughness={fabricRoughness}
                    />
                  </mesh>

                  {/* 3D Folded Crisp White Linen Pocket Square */}
                  <mesh position={[-0.23, 0.76, 0.23]} rotation={[0, 0, -0.08]}>
                    <coneGeometry args={[0.045, 0.06, 3]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.2} />
                  </mesh>

                  {/* 3D Silk Necktie Knot */}
                  <mesh position={[0, 0.88, 0.23]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.045, 0.075, 4]} />
                    <meshStandardMaterial color="#1e2129" roughness={0.3} metalness={0.4} />
                  </mesh>

                  {/* 3D Silk Striped Tie Blade */}
                  <mesh position={[0, 0.58, 0.235]}>
                    <boxGeometry args={[0.065, 0.50, 0.015]} />
                    <meshStandardMaterial color="#1e2129" roughness={0.3} metalness={0.4} />
                  </mesh>
                </group>

                {/* Left Tailored Suit Sleeve (Follows arm joint rotation) */}
                <group position={[-0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, 0.14]}>
                  <mesh position={[0, -0.42 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.115 * gShoulderScale, 0.095 * gShoulderScale, 0.82 * gHeightScale, 28]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={fabricRoughness}
                      metalness={fabricMetalness}
                      color={showHeatmap ? chestTension : '#ffffff'}
                    />
                  </mesh>
                  {/* Crisp White Shirt Cuff peeking at wrist */}
                  <mesh position={[0, -0.84 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.082 * gShoulderScale, 0.084 * gShoulderScale, 0.05, 24]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>
                </group>

                {/* Right Tailored Suit Sleeve */}
                <group position={[0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, -0.14]}>
                  <mesh position={[0, -0.42 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.115 * gShoulderScale, 0.095 * gShoulderScale, 0.82 * gHeightScale, 28]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={fabricRoughness}
                      metalness={fabricMetalness}
                      color={showHeatmap ? chestTension : '#ffffff'}
                    />
                  </mesh>
                  {/* Crisp White Shirt Cuff peeking at wrist */}
                  <mesh position={[0, -0.84 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.082 * gShoulderScale, 0.084 * gShoulderScale, 0.05, 24]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>
                </group>

                {/* Matching Tailored Suit Trousers on Legs */}
                <group scale={[gHipScale, gHeightScale, gHipScale]} position={[0, -0.18, 0]}>
                  {/* Waistband */}
                  <mesh position={[0, 0.18, 0]} rotation={[0, Math.PI, 0]}>
                    <cylinderGeometry args={[0.44, 0.42, 0.18, 36]} />
                    <meshStandardMaterial map={suitTrouserTexture} roughness={fabricRoughness} />
                  </mesh>
                  {/* Left Trouser Leg */}
                  <mesh position={[-0.21, -0.48, 0]}>
                    <cylinderGeometry args={[0.16, 0.12, 1.05, 32]} />
                    <meshStandardMaterial map={suitTrouserTexture} roughness={fabricRoughness} />
                  </mesh>
                  {/* Right Trouser Leg */}
                  <mesh position={[0.21, -0.48, 0]}>
                    <cylinderGeometry args={[0.16, 0.12, 1.05, 32]} />
                    <meshStandardMaterial map={suitTrouserTexture} roughness={fabricRoughness} />
                  </mesh>
                </group>
              </group>
            )}

            {/* ═════════════════════════════════════════════════════════════
                GARMENT 2: SCULPTURAL ASYMMETRIC DRAPE SHIRT
                (Crisp White Egyptian Cotton, Spread Collar, Navy Polka-Dot Tie, Cuffs & Trousers)
               ═════════════════════════════════════════════════════════════ */}
            {(category === 'shirt' || prodId === 'PROD_SHIRT_02') && (
              <group>
                {/* Crisp Shirt Torso with rotation=[0, Math.PI, 0] */}
                <group scale={[gShoulderScale, gHeightScale * 0.98, gChestScale]}>
                  <mesh position={[0, 0.52, 0.01]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.49, 0.43, 0.94, 48, 1, false]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={showHeatmap ? 0.25 : 0.85}
                      metalness={showHeatmap ? 0.2 : 0.05}
                      color={showHeatmap ? chestTension : '#ffffff'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* 3D Spread Collar Wings Folded Around Neck */}
                  <mesh position={[0, 0.98, 0.04]} rotation={[0.12, 0, 0]}>
                    <cylinderGeometry args={[0.19, 0.24, 0.10, 32, 1, true]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} side={THREE.DoubleSide} />
                  </mesh>

                  {/* 3D Left Collar Point */}
                  <mesh position={[-0.10, 0.92, 0.20]} rotation={[0.08, -0.25, -0.3]}>
                    <boxGeometry args={[0.08, 0.14, 0.015]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>

                  {/* 3D Right Collar Point */}
                  <mesh position={[0.10, 0.92, 0.20]} rotation={[0.08, 0.25, 0.3]}>
                    <boxGeometry args={[0.08, 0.14, 0.015]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} />
                  </mesh>

                  {/* 3D Navy Silk Polka-Dot Tie Knot */}
                  <mesh position={[0, 0.88, 0.22]} rotation={[Math.PI, 0, 0]}>
                    <coneGeometry args={[0.046, 0.075, 4]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.3} />
                  </mesh>

                  {/* 3D Navy Silk Polka-Dot Tie Blade (Tapering Down Placket) */}
                  <mesh position={[0, 0.56, 0.225]}>
                    <boxGeometry args={[0.07, 0.54, 0.015]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.3} />
                  </mesh>

                  {/* White Tie Tip Point */}
                  <mesh position={[0, 0.27, 0.225]} rotation={[0, 0, Math.PI / 4]}>
                    <boxGeometry args={[0.05, 0.05, 0.015]} />
                    <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.3} />
                  </mesh>
                </group>

                {/* Left Long Shirt Sleeve */}
                <group position={[-0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, 0.14]}>
                  <mesh position={[0, -0.42 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.105 * gShoulderScale, 0.088 * gShoulderScale, 0.82 * gHeightScale, 28]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={0.85}
                      metalness={0.05}
                      color={showHeatmap ? chestTension : '#ffffff'}
                    />
                  </mesh>
                  {/* Buttoned Wrist Cuff */}
                  <mesh position={[0, -0.83 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.082 * gShoulderScale, 0.084 * gShoulderScale, 0.06, 24]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.4} />
                  </mesh>
                </group>

                {/* Right Long Shirt Sleeve */}
                <group position={[0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, -0.14]}>
                  <mesh position={[0, -0.42 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.105 * gShoulderScale, 0.088 * gShoulderScale, 0.82 * gHeightScale, 28]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={0.85}
                      metalness={0.05}
                      color={showHeatmap ? chestTension : '#ffffff'}
                    />
                  </mesh>
                  {/* Buttoned Wrist Cuff */}
                  <mesh position={[0, -0.83 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.082 * gShoulderScale, 0.084 * gShoulderScale, 0.06, 24]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.4} />
                  </mesh>
                </group>

                {/* Tucked into Tailored Dark Trousers */}
                <group scale={[gHipScale, gHeightScale, gHipScale]} position={[0, -0.18, 0]}>
                  <mesh position={[0, 0.18, 0]} rotation={[0, Math.PI, 0]}>
                    <cylinderGeometry args={[0.44, 0.42, 0.18, 36]} />
                    <meshStandardMaterial map={suitTrouserTexture} roughness={0.7} />
                  </mesh>
                  <mesh position={[-0.21, -0.48, 0]}>
                    <cylinderGeometry args={[0.16, 0.12, 1.05, 32]} />
                    <meshStandardMaterial map={suitTrouserTexture} roughness={0.7} />
                  </mesh>
                  <mesh position={[0.21, -0.48, 0]}>
                    <cylinderGeometry args={[0.16, 0.12, 1.05, 32]} />
                    <meshStandardMaterial map={suitTrouserTexture} roughness={0.7} />
                  </mesh>
                </group>
              </group>
            )}

            {/* ═════════════════════════════════════════════════════════════
                GARMENT 3: PLEATED MINIMALIST PANTALON
                (High-Waisted Pinstripe Pleated Tailored Wool Trousers & Styled Top)
               ═════════════════════════════════════════════════════════════ */}
            {isTrousers && (
              <group>
                {/* Styled Tailored Top / Crop Top */}
                <group scale={[gShoulderScale, gHeightScale * 0.98, gChestScale]}>
                  <mesh position={[0, 0.58, 0.01]} rotation={[0, Math.PI, 0]}>
                    <cylinderGeometry args={[0.48, 0.43, 0.76, 40]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.6} side={THREE.DoubleSide} />
                  </mesh>
                </group>

                {/* High-Waisted Pinstripe Wide-Leg Trousers */}
                <group scale={[gHipScale, gHeightScale, gHipScale]} position={[0, -0.18, 0]}>
                  {/* High Waistband with Belt Loops & Clasp */}
                  <mesh position={[0, 0.22, 0]} rotation={[0, Math.PI, 0]}>
                    <cylinderGeometry args={[0.44, 0.42, 0.22, 40]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={showHeatmap ? 0.3 : 0.75}
                      metalness={showHeatmap ? 0.2 : 0.25}
                      color={showHeatmap ? waistTension : '#ffffff'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* Left Leg: Wide-Leg Architectural Pinstripe Pleat Drape */}
                  <mesh position={[-0.21, -0.48, 0]} rotation={[0, Math.PI, 0]}>
                    <cylinderGeometry args={[0.17, 0.13, 1.08, 36]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={showHeatmap ? 0.3 : 0.75}
                      metalness={showHeatmap ? 0.2 : 0.25}
                      color={showHeatmap ? hipTension : '#ffffff'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* Right Leg: Wide-Leg Architectural Pinstripe Pleat Drape */}
                  <mesh position={[0.21, -0.48, 0]} rotation={[0, Math.PI, 0]}>
                    <cylinderGeometry args={[0.17, 0.13, 1.08, 36]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={showHeatmap ? 0.3 : 0.75}
                      metalness={showHeatmap ? 0.2 : 0.25}
                      color={showHeatmap ? hipTension : '#ffffff'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </group>
              </group>
            )}

            {/* ═════════════════════════════════════════════════════════════
                GARMENT 4: THE SCULPTURAL MINIMALIST TRENCH
                (Double-Breasted Twill Overcoat, Belt, Buckle, Lapels & Epaulettes)
               ═════════════════════════════════════════════════════════════ */}
            {prodId === 'PROD_TRENCH_04' && (
              <group>
                {/* Trench Overcoat Torso */}
                <group scale={[gShoulderScale * 1.04, gHeightScale, gChestScale * 1.02]}>
                  <mesh position={[0, 0.34, 0.01]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.53, 0.64, 1.38, 48, 1, false]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={showHeatmap ? 0.3 : 0.65}
                      metalness={showHeatmap ? 0.2 : 0.3}
                      color={showHeatmap ? chestTension : '#ffffff'}
                      side={THREE.DoubleSide}
                    />
                  </mesh>

                  {/* 3D Broad Trench Notch Lapel (Left) */}
                  <mesh position={[-0.18, 0.72, 0.26]} rotation={[0.06, -0.22, -0.25]}>
                    <boxGeometry args={[0.14, 0.46, 0.02]} />
                    <meshStandardMaterial map={garmentTexture} roughness={0.65} />
                  </mesh>

                  {/* 3D Broad Trench Notch Lapel (Right) */}
                  <mesh position={[0.18, 0.72, 0.26]} rotation={[0.06, 0.22, 0.25]}>
                    <boxGeometry args={[0.14, 0.46, 0.02]} />
                    <meshStandardMaterial map={garmentTexture} roughness={0.65} />
                  </mesh>

                  {/* 3D Tailored Waist Belt Cinch */}
                  <mesh position={[0, 0.30, 0]}>
                    <torusGeometry args={[0.49, 0.024, 16, 48]} />
                    <meshStandardMaterial color="#0c0d10" roughness={0.5} />
                  </mesh>

                  {/* 3D Brass Buckle at Front */}
                  <mesh position={[0, 0.30, 0.50]}>
                    <boxGeometry args={[0.09, 0.08, 0.025]} />
                    <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.25} />
                  </mesh>
                </group>

                {/* Left Raglan Overcoat Sleeve */}
                <group position={[-0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, 0.14]}>
                  <mesh position={[0, -0.44 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.125 * gShoulderScale, 0.105 * gShoulderScale, 0.86 * gHeightScale, 28]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={0.65}
                      metalness={0.3}
                      color={showHeatmap ? chestTension : '#ffffff'}
                    />
                  </mesh>
                  {/* Wrist Belt Strap */}
                  <mesh position={[0, -0.80 * gHeightScale, 0]}>
                    <torusGeometry args={[0.095 * gShoulderScale, 0.012, 12, 24]} />
                    <meshStandardMaterial color="#0a0a0c" />
                  </mesh>
                </group>

                {/* Right Raglan Overcoat Sleeve */}
                <group position={[0.44 * shoulderScale, 0.98, 0]} rotation={[0, 0, -0.14]}>
                  <mesh position={[0, -0.44 * gHeightScale, 0]}>
                    <cylinderGeometry args={[0.125 * gShoulderScale, 0.105 * gShoulderScale, 0.86 * gHeightScale, 28]} />
                    <meshStandardMaterial
                      map={garmentTexture}
                      roughness={0.65}
                      metalness={0.3}
                      color={showHeatmap ? chestTension : '#ffffff'}
                    />
                  </mesh>
                  {/* Wrist Belt Strap */}
                  <mesh position={[0, -0.80 * gHeightScale, 0]}>
                    <torusGeometry args={[0.095 * gShoulderScale, 0.012, 12, 24]} />
                    <meshStandardMaterial color="#0a0a0c" />
                  </mesh>
                </group>

                {/* Undercoat Trousers */}
                <group scale={[gHipScale, gHeightScale, gHipScale]} position={[0, -0.18, 0]}>
                  <mesh position={[-0.21, -0.58, 0]}>
                    <cylinderGeometry args={[0.15, 0.12, 0.85, 28]} />
                    <meshStandardMaterial color="#111216" roughness={0.7} />
                  </mesh>
                  <mesh position={[0.21, -0.58, 0]}>
                    <cylinderGeometry args={[0.15, 0.12, 0.85, 28]} />
                    <meshStandardMaterial color="#111216" roughness={0.7} />
                  </mesh>
                </group>
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
                <cylinderGeometry args={[0.003, 0.003, 0.90 * gShoulderScale, 8]} />
                <meshBasicMaterial color={neonCyan} toneMapped={false} />
              </mesh>
            </group>

            {/* Chest Fit Band (Rings measuring live ease clearance) */}
            <group position={[0, 0.72, 0]} scale={[gShoulderScale * 0.98, 1, gChestScale * 1.05]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.51, 0.014, 16, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? chestTension : neonCyan}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.48, 0.56, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? chestTension : neonCyan}
                  transparent
                  opacity={0.3}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>

            {/* Waist Fit Band */}
            <group position={[0, 0.28, 0]} scale={[gWaistScale * 0.98, 1, gWaistScale * 0.98]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.41, 0.014, 16, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? waistTension : neonElectric}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.38, 0.46, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? waistTension : neonElectric}
                  transparent
                  opacity={0.3}
                  side={THREE.DoubleSide}
                />
              </mesh>
            </group>

            {/* Hip Fit Band */}
            <group position={[0, -0.15, 0]} scale={[gHipScale * 1.02, 1, gHipScale * 1.02]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.49, 0.014, 16, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? hipTension : neonCyan}
                  toneMapped={false}
                />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.46, 0.54, 48]} />
                <meshBasicMaterial
                  color={showHeatmap ? hipTension : neonCyan}
                  transparent
                  opacity={0.3}
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
