import { CATEGORIES } from './types';

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
  const stretchOffset = {
    none: 0,
    low: 1.2,
    medium: 2.8,
    high: 5.0
  }[product.stretch_level || "low"] || 1.0;

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

      weightedErrorSum += normalizedError * (weights.chest || 0.4);
      totalWeightApplied += (weights.chest || 0.4);

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

      weightedErrorSum += normalizedError * (weights.shoulder || 0.3);
      totalWeightApplied += (weights.shoulder || 0.3);

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

      weightedErrorSum += normalizedError * (weights.waist || 0.3);
      totalWeightApplied += (weights.waist || 0.3);

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

      weightedErrorSum += normalizedError * (weights.hip || 0.3);
      totalWeightApplied += (weights.hip || 0.3);

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

    // 5. LENGTH & SLEEVE EVALUATION
    if (sizeOption.sleeve_cm && userMeasurements.sleeve_length_cm) {
      const diff = sizeOption.sleeve_cm - userMeasurements.sleeve_length_cm;
      dimensionAnalysis.sleeve = {
        name: "Sleeve Length",
        body_val: userMeasurements.sleeve_length_cm,
        garment_val: sizeOption.sleeve_cm,
        actual_ease: Math.round(diff * 10) / 10,
        target_ease: 2.0,
        status: Math.abs(diff) <= 2.5 ? "good" : diff < 0 ? "slightly_short" : "slightly_long"
      };
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

  // Generate deterministic explanation
  let explanation = `Size ${bestMatch.size} provides the optimal balance for your selected ${activeFitPref} fit.`;
  const chestAnal = bestMatch.dimension_analysis.chest;
  const shoulderAnal = bestMatch.dimension_analysis.shoulder;
  const waistAnal = bestMatch.dimension_analysis.waist;

  if (chestAnal && shoulderAnal) {
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

