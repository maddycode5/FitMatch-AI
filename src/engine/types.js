/**
 * Universal Body Measurement & Fit Engine Configuration
 * Standardized across all apparel categories.
 */

export const MEASUREMENT_BOUNDS = {
  height_cm: { min: 120, max: 230, label: "Height", default: 178 },
  weight_kg: { min: 35, max: 220, label: "Weight", default: 72 },
  chest_cm: { min: 65, max: 160, label: "Chest Circumference", default: 98 },
  waist_cm: { min: 50, max: 150, label: "Waist Circumference", default: 82 },
  hip_cm: { min: 70, max: 160, label: "Hip Circumference", default: 96 },
  shoulder_cm: { min: 32, max: 62, label: "Shoulder Width", default: 45 },
  neck_cm: { min: 28, max: 55, label: "Neck Circumference", default: 39 },
  arm_length_cm: { min: 45, max: 85, label: "Arm Length", default: 62 },
  sleeve_length_cm: { min: 15, max: 90, label: "Sleeve Length", default: 63 },
  inseam_cm: { min: 55, max: 105, label: "Inseam (Crotch to Ankle)", default: 80 },
  thigh_cm: { min: 38, max: 95, label: "Thigh Circumference", default: 56 },
  outseam_cm: { min: 75, max: 130, label: "Outseam (Waist to Ankle)", default: 104 }
};

export const CATEGORIES = {
  tshirt: {
    id: "tshirt",
    name: "T-Shirt",
    required_body_dimensions: ["chest_cm", "shoulder_cm"],
    optional_body_dimensions: ["waist_cm", "height_cm"],
    garment_dimensions: ["garment_chest_cm", "shoulder_cm", "garment_length_cm"],
    primary_dimension: "chest_cm",
    primary_garment_key: "garment_chest_cm",
    ease_targets: {
      slim: { chest: 4.0, waist: 6.0, shoulder: 0.5 },
      regular: { chest: 8.0, waist: 10.0, shoulder: 1.5 },
      oversized: { chest: 16.0, waist: 18.0, shoulder: 3.5 }
    },
    dimension_weights: {
      chest: 0.50,
      shoulder: 0.35,
      length: 0.15
    },
    critical_minimum_ease: {
      chest: 1.0, // A t-shirt must have at least 1cm ease to be wearable
      shoulder: -1.0
    }
  },
  shirt: {
    id: "shirt",
    name: "Tailored Shirt",
    required_body_dimensions: ["chest_cm", "neck_cm", "shoulder_cm"],
    optional_body_dimensions: ["waist_cm", "arm_length_cm"],
    garment_dimensions: ["garment_chest_cm", "neck_cm", "shoulder_cm", "sleeve_cm", "garment_length_cm"],
    primary_dimension: "chest_cm",
    primary_garment_key: "garment_chest_cm",
    ease_targets: {
      slim: { chest: 6.0, waist: 6.0, neck: 1.5, shoulder: 1.0 },
      regular: { chest: 10.0, waist: 10.0, neck: 2.5, shoulder: 2.0 },
      oversized: { chest: 18.0, waist: 18.0, neck: 3.5, shoulder: 4.0 }
    },
    dimension_weights: {
      chest: 0.40,
      shoulder: 0.30,
      neck: 0.15,
      sleeve: 0.15
    },
    critical_minimum_ease: {
      chest: 2.0,
      neck: 1.0,
      shoulder: 0.0
    }
  },
  jacket: {
    id: "jacket",
    name: "Jacket & Trench",
    required_body_dimensions: ["chest_cm", "shoulder_cm"],
    optional_body_dimensions: ["waist_cm", "arm_length_cm", "height_cm"],
    garment_dimensions: ["garment_chest_cm", "shoulder_cm", "sleeve_cm", "garment_length_cm"],
    primary_dimension: "chest_cm",
    primary_garment_key: "garment_chest_cm",
    ease_targets: {
      slim: { chest: 8.0, shoulder: 1.5, sleeve: 3.0 },
      regular: { chest: 14.0, shoulder: 2.5, sleeve: 4.0 },
      oversized: { chest: 22.0, shoulder: 5.0, sleeve: 6.0 }
    },
    dimension_weights: {
      chest: 0.45,
      shoulder: 0.35,
      sleeve: 0.20
    },
    critical_minimum_ease: {
      chest: 4.0,
      shoulder: 0.5
    }
  },
  jeans: {
    id: "jeans",
    name: "Jeans & Trousers",
    required_body_dimensions: ["waist_cm", "hip_cm", "inseam_cm"],
    optional_body_dimensions: ["thigh_cm"],
    garment_dimensions: ["garment_waist_cm", "garment_hip_cm", "inseam_cm", "thigh_cm"],
    primary_dimension: "waist_cm",
    primary_garment_key: "garment_waist_cm",
    ease_targets: {
      slim: { waist: 1.0, hip: 3.0, thigh: 2.0, inseam: 0.0 },
      regular: { waist: 3.0, hip: 6.0, thigh: 4.5, inseam: 1.0 },
      oversized: { waist: 6.0, hip: 12.0, thigh: 8.0, inseam: 2.0 }
    },
    dimension_weights: {
      waist: 0.45,
      hip: 0.30,
      thigh: 0.15,
      inseam: 0.10
    },
    critical_minimum_ease: {
      waist: -1.0, // Stretchy denim can allow slightly negative ease, but rigid requires >= 0
      hip: 1.0
    }
  },
  dress: {
    id: "dress",
    name: "Dress",
    required_body_dimensions: ["chest_cm", "waist_cm", "hip_cm"],
    optional_body_dimensions: ["shoulder_cm", "height_cm"],
    garment_dimensions: ["garment_chest_cm", "garment_waist_cm", "garment_hip_cm", "garment_length_cm"],
    primary_dimension: "chest_cm",
    primary_garment_key: "garment_chest_cm",
    ease_targets: {
      slim: { chest: 3.0, waist: 2.0, hip: 4.0 },
      regular: { chest: 7.0, waist: 5.0, hip: 8.0 },
      oversized: { chest: 14.0, waist: 12.0, hip: 16.0 }
    },
    dimension_weights: {
      chest: 0.35,
      waist: 0.35,
      hip: 0.30
    },
    critical_minimum_ease: {
      chest: 0.0,
      waist: 0.0,
      hip: 1.0
    }
  }
};

export const INITIAL_USER_PROFILE = {
  user_id: "ANON_GUEST",
  height_cm: 178,
  weight_kg: 72,
  age_range: "25-34",
  unit: "cm",
  measurements: {
    chest_cm: 98,
    waist_cm: 82,
    hip_cm: 96,
    shoulder_cm: 45,
    neck_cm: 39,
    arm_length_cm: 62,
    sleeve_length_cm: 63,
    inseam_cm: 80,
    thigh_cm: 56
  },
  measurement_metadata: {
    source: "manual", // 'manual' | 'camera' | 'photo' | 'ai_estimated_verified'
    confidence: {
      chest_cm: 1.0,
      waist_cm: 1.0,
      hip_cm: 1.0,
      shoulder_cm: 1.0,
      height_cm: 1.0
    },
    verified_by_user: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  fit_preferences: {
    default_fit: "regular" // 'slim' | 'regular' | 'oversized'
  }
};

