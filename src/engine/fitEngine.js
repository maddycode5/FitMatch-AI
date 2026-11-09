import { CATEGORIES } from './types.js';

/**
 * Deterministic, Category-Aware Fit Recommendation Engine
 * Compares customer body profile directly with a product's exact size chart.
 */
export function calculateProductFit({
  customerProfile,
  product,
  fitPreference = "regular"
}) {
  const categoryConfig = CATEGORIES[product.category] || CATEGORIES.tshirt;
  const userMeasurements = customerProfile.measurements || {};
  const activeFitPref = fitPreference || customerProfile.fit_preferences?.default_fit || "regular";
  const targetEaseConfig = categoryConfig.ease_targets[activeFitPref] || categoryConfig.ease_targets.regular;
  const weights = categoryConfig.dimension_weights;
  const criticalMins = categoryConfig.critical_minimum_ease || {};

  // Check if primary dimension exists in user profile
  const primaryDim = categoryConfig.primary_dimension;
  if (!userMeasurements[primaryDim]) {
    return {
      status: "insufficient_data",
      recommended_size: null,
      fit_score: 0,
      confidence: "insufficient_data",
      explanation: `Missing primary body dimension (${primaryDim.replace('_', ' ')}). Please provide this measurement to receive accurate sizing.`,
      size_evaluations: []
    };
  }

  // Fabric stretch offset factor (in cm)
  // Fix: Explicit lookup table prevents JavaScript's 0 falsy coercion where { none: 0 } became 1.0 via || 1.0.
  const STRETCH_OFFSETS = {
    none: 0.0,
    low: 1.2,
    medium: 2.8,
    high: 5.0
  };
  const stretchKey = (product.stretch_level && Object.prototype.hasOwnProperty.call(STRETCH_OFFSETS, product.stretch_level))
    ? product.stretch_level
    : "low";
  const stretchOffset = STRETCH_OFFSETS[stretchKey];

  // Evaluate every size in the product's size chart
  const evaluatedSizes = product.size_chart.map((sizeOption) => {
    let weightedErrorSum = 0;
    let totalWeightApplied = 0;
    let hasCriticalViolation = false;
    const dimensionAnalysis = {};
    const tensionMap = {};

    // 1. CHEST / BUST EVALUATION
    if (sizeOption.garment_chest_cm && userMeasurements.chest_cm) {
      const actualEase = (sizeOption.garment_chest_cm - userMeasurements.chest_cm) + (stretchOffset * 0.5);
      const targetEase = targetEaseConfig.chest ?? 8.0;
      const criticalMin = criticalMins.chest ?? 1.0;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      // Asymmetric penalty: Being too tight is 1.8x more penalizing than being slightly roomy
      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 1.8 : 1.0;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 14.0) * penaltyFactor);

      const dimWeight = weights.chest ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      // Dimension status classification
      let status = "good";
      if (diff < -4.0) status = "too_tight";
      else if (diff < -1.5) status = "slightly_tight";
      else if (diff > 8.0) status = "too_loose";
      else if (diff > 3.5) status = "slightly_loose";

      dimensionAnalysis.chest = {
        name: "Chest / Bust",
        body_val: userMeasurements.chest_cm,
        garment_val: sizeOption.garment_chest_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      // Normalized tension for 3D shaders: -1.0 (overstretched) to 0.0 (perfect) to +1.0 (slack)
      tensionMap.chest = Math.max(-1.0, Math.min(1.0, diff / 8.0));
    }

    // 2. SHOULDER EVALUATION
    if (sizeOption.shoulder_cm && userMeasurements.shoulder_cm) {
      const actualEase = sizeOption.shoulder_cm - userMeasurements.shoulder_cm;
      const targetEase = targetEaseConfig.shoulder ?? 1.5;
      const criticalMin = criticalMins.shoulder ?? -0.5;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 2.0 : 1.0; // tight shoulders are very uncomfortable
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 6.0) * penaltyFactor);

      const dimWeight = weights.shoulder ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -2.0) status = "too_tight";
      else if (diff < -0.8) status = "slightly_tight";
      else if (diff > 4.0) status = "too_loose";
      else if (diff > 2.0) status = "slightly_loose";

      dimensionAnalysis.shoulder = {
        name: "Shoulder Width",
        body_val: userMeasurements.shoulder_cm,
        garment_val: sizeOption.shoulder_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.shoulder = Math.max(-1.0, Math.min(1.0, diff / 4.0));
    }

    // 3. WAIST EVALUATION
    if (sizeOption.garment_waist_cm && userMeasurements.waist_cm) {
      const actualEase = (sizeOption.garment_waist_cm - userMeasurements.waist_cm) + stretchOffset;
      const targetEase = targetEaseConfig.waist ?? 4.0;
      const criticalMin = criticalMins.waist ?? 0.0;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 2.2 : 0.9;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 10.0) * penaltyFactor);

      const dimWeight = weights.waist ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -3.0) status = "too_tight";
      else if (diff < -1.0) status = "slightly_tight";
      else if (diff > 6.0) status = "too_loose";
      else if (diff > 3.0) status = "slightly_loose";

      dimensionAnalysis.waist = {
        name: "Waist",
        body_val: userMeasurements.waist_cm,
        garment_val: sizeOption.garment_waist_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.waist = Math.max(-1.0, Math.min(1.0, diff / 6.0));
    }

    // 4. HIP EVALUATION
    if (sizeOption.garment_hip_cm && userMeasurements.hip_cm) {
      const actualEase = (sizeOption.garment_hip_cm - userMeasurements.hip_cm) + stretchOffset;
      const targetEase = targetEaseConfig.hip ?? 6.0;
      const criticalMin = criticalMins.hip ?? 1.0;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 2.0 : 1.0;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 12.0) * penaltyFactor);

      const dimWeight = weights.hip ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -3.0) status = "too_tight";
      else if (diff < -1.0) status = "slightly_tight";
      else if (diff > 7.0) status = "too_loose";
      else if (diff > 3.0) status = "slightly_loose";

      dimensionAnalysis.hip = {
        name: "Hips",
        body_val: userMeasurements.hip_cm,
        garment_val: sizeOption.garment_hip_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.hip = Math.max(-1.0, Math.min(1.0, diff / 8.0));
    }

    // 5. NECK / COLLAR EVALUATION (Shirts)
    if (sizeOption.neck_cm && userMeasurements.neck_cm) {
      const actualEase = sizeOption.neck_cm - userMeasurements.neck_cm;
      const targetEase = targetEaseConfig.neck ?? 2.5;
      const criticalMin = criticalMins.neck ?? 1.0;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      // Tight collar restricts breathing when fully buttoned
      const penaltyFactor = diff < 0 ? 2.5 : 0.8;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 5.0) * penaltyFactor);

      const dimWeight = weights.neck ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -1.5) status = "too_tight";
      else if (diff < -0.5) status = "slightly_tight";
      else if (diff > 4.0) status = "too_loose";
      else if (diff > 2.0) status = "slightly_loose";

      dimensionAnalysis.neck = {
        name: "Collar / Neck",
        body_val: userMeasurements.neck_cm,
        garment_val: sizeOption.neck_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.neck = Math.max(-1.0, Math.min(1.0, diff / 4.0));
    }

    // 6. SLEEVE LENGTH EVALUATION (Shirts & Jackets)
    const userSleeve = userMeasurements.sleeve_length_cm || userMeasurements.arm_length_cm;
    if (sizeOption.sleeve_cm && userSleeve) {
      const actualEase = sizeOption.sleeve_cm - userSleeve;
      const targetEase = targetEaseConfig.sleeve ?? (product.category === 'jacket' ? 4.0 : 2.5);
      const criticalMin = criticalMins.sleeve ?? -0.5;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 1.8 : 1.0;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 6.0) * penaltyFactor);

      const dimWeight = weights.sleeve ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -2.2) status = "too_tight";
      else if (diff < -0.8) status = "slightly_tight";
      else if (diff > 4.5) status = "too_loose";
      else if (diff > 2.0) status = "slightly_loose";

      dimensionAnalysis.sleeve = {
        name: "Sleeve Length",
        body_val: userSleeve,
        garment_val: sizeOption.sleeve_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.sleeve = Math.max(-1.0, Math.min(1.0, diff / 5.0));
    }

    // 7. THIGH CIRCUMFERENCE EVALUATION (Jeans & Trousers)
    if (sizeOption.thigh_cm && userMeasurements.thigh_cm) {
      const actualEase = (sizeOption.thigh_cm - userMeasurements.thigh_cm) + (stretchOffset * 0.4);
      const targetEase = targetEaseConfig.thigh ?? 4.5;
      const criticalMin = criticalMins.thigh ?? 0.5;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 2.0 : 0.9;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 8.0) * penaltyFactor);

      const dimWeight = weights.thigh ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -2.0) status = "too_tight";
      else if (diff < -0.8) status = "slightly_tight";
      else if (diff > 5.0) status = "too_loose";
      else if (diff > 2.5) status = "slightly_loose";

      dimensionAnalysis.thigh = {
        name: "Thigh Circumference",
        body_val: userMeasurements.thigh_cm,
        garment_val: sizeOption.thigh_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.thigh = Math.max(-1.0, Math.min(1.0, diff / 6.0));
    }

    // 8. INSEAM LENGTH EVALUATION (Jeans & Trousers)
    if (sizeOption.inseam_cm && userMeasurements.inseam_cm) {
      const actualEase = sizeOption.inseam_cm - userMeasurements.inseam_cm;
      const targetEase = targetEaseConfig.inseam ?? 1.0;
      const criticalMin = criticalMins.inseam ?? -2.0;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = actualEase - targetEase;
      const penaltyFactor = diff < 0 ? 1.6 : 1.1;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 7.0) * penaltyFactor);

      const dimWeight = weights.inseam ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -2.5) status = "too_tight";
      else if (diff < -0.8) status = "slightly_tight";
      else if (diff > 4.0) status = "too_loose";
      else if (diff > 2.0) status = "slightly_loose";

      dimensionAnalysis.inseam = {
        name: "Inseam (Leg Length)",
        body_val: userMeasurements.inseam_cm,
        garment_val: sizeOption.inseam_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.inseam = Math.max(-1.0, Math.min(1.0, diff / 6.0));
    }

    // 9. GARMENT LENGTH EVALUATION (T-Shirts & Tops)
    if (sizeOption.garment_length_cm && (userMeasurements.height_cm || weights.length)) {
      const refHeight = userMeasurements.height_cm || 178;
      const idealTorsoBenchmark = Math.round(refHeight * 0.41);
      const targetEase = targetEaseConfig.length ?? (activeFitPref === 'slim' ? -1.0 : activeFitPref === 'oversized' ? 4.0 : 1.5);
      const targetLength = idealTorsoBenchmark + targetEase;
      const actualEase = sizeOption.garment_length_cm - idealTorsoBenchmark;
      const criticalMin = criticalMins.length ?? -4.0;

      if (actualEase < criticalMin) {
        hasCriticalViolation = true;
      }

      const diff = sizeOption.garment_length_cm - targetLength;
      const penaltyFactor = diff < 0 ? 1.7 : 0.8;
      const normalizedError = Math.min(1.0, (Math.abs(diff) / 9.0) * penaltyFactor);

      const dimWeight = weights.length ?? 0.0;
      if (dimWeight > 0) {
        weightedErrorSum += normalizedError * dimWeight;
        totalWeightApplied += dimWeight;
      }

      let status = "good";
      if (diff < -3.5) status = "too_tight";
      else if (diff < -1.2) status = "slightly_tight";
      else if (diff > 5.5) status = "too_loose";
      else if (diff > 2.5) status = "slightly_loose";

      dimensionAnalysis.length = {
        name: "Garment Length",
        body_val: idealTorsoBenchmark,
        garment_val: sizeOption.garment_length_cm,
        actual_ease: Math.round(actualEase * 10) / 10,
        target_ease: targetEase,
        status
      };

      tensionMap.length = Math.max(-1.0, Math.min(1.0, diff / 8.0));
    }

    // Calculate normalized composite score
    const avgError = totalWeightApplied > 0 ? (weightedErrorSum / totalWeightApplied) : 0.5;
    let finalScore = Math.round(100 * (1.0 - avgError));

    if (hasCriticalViolation) {
      // Severe disqualification penalty for physically tight dimensions
      finalScore = Math.min(finalScore, 44);
    }

    return {
      size: sizeOption.size,
      raw_option: sizeOption,
      fit_score: Math.max(0, Math.min(100, finalScore)),
      has_critical_violation: hasCriticalViolation,
      dimension_analysis: dimensionAnalysis,
      tension_map: tensionMap
    };
  });

  // Sort sizes by highest fit score
  evaluatedSizes.sort((a, b) => b.fit_score - a.fit_score);

  const bestMatch = evaluatedSizes[0];
  const secondBest = evaluatedSizes.length > 1 ? evaluatedSizes[1] : null;

  // Determine Confidence
  const metaSource = customerProfile.measurement_metadata?.source || "manual";
  const isVerified = customerProfile.measurement_metadata?.verified_by_user ?? true;
  let confidence = "high";

  if (metaSource === "camera" || metaSource === "photo") {
    confidence = isVerified ? "high" : "medium";
  } else if (!isVerified) {
    confidence = "medium";
  }

  if (bestMatch.fit_score < 70) {
    confidence = "low";
  }

  // Generate deterministic category-aware explanation
  let explanation = `Size ${bestMatch.size} provides the optimal balance for your selected ${activeFitPref} fit.`;
  const chestAnal = bestMatch.dimension_analysis.chest;
  const shoulderAnal = bestMatch.dimension_analysis.shoulder;
  const waistAnal = bestMatch.dimension_analysis.waist;
  const neckAnal = bestMatch.dimension_analysis.neck;
  const sleeveAnal = bestMatch.dimension_analysis.sleeve;
  const thighAnal = bestMatch.dimension_analysis.thigh;
  const inseamAnal = bestMatch.dimension_analysis.inseam;
  const lengthAnal = bestMatch.dimension_analysis.length;

  if (product.category === "jeans" && waistAnal) {
    const extra = [];
    if (thighAnal) extra.push(`+${thighAnal.actual_ease}cm thigh ease`);
    if (inseamAnal) extra.push(`+${inseamAnal.actual_ease}cm inseam break`);
    explanation = `Size ${bestMatch.size} delivers +${waistAnal.actual_ease}cm waist comfort${extra.length ? ` with ${extra.join(' and ')}` : ''} for a tailored ${activeFitPref} trouser drape.`;
  } else if (product.category === "shirt" && chestAnal) {
    const extra = [];
    if (neckAnal) extra.push(`+${neckAnal.actual_ease}cm collar comfort`);
    if (sleeveAnal) extra.push(`+${sleeveAnal.actual_ease}cm sleeve cuff alignment`);
    explanation = `Size ${bestMatch.size} provides +${chestAnal.actual_ease}cm chest ease${extra.length ? ` with ${extra.join(' and ')}` : ''} for a bespoke shirt silhouette.`;
  } else if (product.category === "jacket" && chestAnal) {
    const extra = sleeveAnal ? ` and +${sleeveAnal.actual_ease}cm tailored sleeve length` : '';
    explanation = `Size ${bestMatch.size} delivers +${chestAnal.actual_ease}cm chest ease${extra} over suit canvassing for an architectural outerwear drape.`;
  } else if (product.category === "tshirt" && chestAnal) {
    const extra = lengthAnal ? ` and +${lengthAnal.actual_ease}cm torso drape length` : '';
    explanation = `Size ${bestMatch.size} gives +${chestAnal.actual_ease}cm chest room${extra} in pure cotton drape.`;
  } else if (chestAnal && shoulderAnal) {
    explanation = `Size ${bestMatch.size} delivers +${chestAnal.actual_ease}cm of chest ease and aligns your shoulder width with tailor-grade precision for a ${activeFitPref} silhouette.`;
  } else if (waistAnal) {
    explanation = `Size ${bestMatch.size} provides +${waistAnal.actual_ease}cm waist comfort with proper hip clearance.`;
  }

  if (bestMatch.has_critical_violation) {
    explanation = `Warning: Even size ${bestMatch.size} will fit tight on key physiological boundaries. Consider a larger size or a more relaxed cut.`;
  }

  return {
    status: "success",
    recommended_size: bestMatch.size,
    fit_score: bestMatch.fit_score,
    confidence,
    fit_preference: activeFitPref,
    dimension_analysis: bestMatch.dimension_analysis,
    tension_map: bestMatch.tension_map,
    alternative_size: secondBest && secondBest.fit_score > 65 ? secondBest.size : null,
    alternative_fit_score: secondBest ? secondBest.fit_score : null,
    explanation,
    all_sizes: evaluatedSizes
  };
}
