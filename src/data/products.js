/**
 * FitMatch AI Luxury Product Catalog & Size Charts
 * Note: Measurements represent true physical GARMENT dimensions, not body sizes.
 */

export const LUXURY_PRODUCTS = [
  {
    id: "PROD_TRENCH_01",
    brand: "Atelier FitMatch",
    category: "jacket",
    product_name: "The Sculptural Minimalist Trench",
    fabric: "Heavyweight Double-Weave Silk-Wool (420 GSM)",
    stretch_level: "low",
    fit_type: "regular",
    price: "EUR 1,480",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    description: "An architectural outerwear masterpiece with structured raglan sleeves, micro-crease dynamics, and drop-shoulder drape.",
    colorways: [
      { id: "noir", name: "Void Noir", hex: "#111113", metalness: 0.85, roughness: 0.22, clearcoat: 0.9 },
      { id: "alabaster", name: "Alabaster Chalk", hex: "#EBEBEB", metalness: 0.25, roughness: 0.35, clearcoat: 0.6 },
      { id: "camel", name: "Desert Camel", hex: "#A88B73", metalness: 0.40, roughness: 0.45, clearcoat: 0.4 },
      { id: "sage", name: "Slate Sage", hex: "#5C6466", metalness: 0.60, roughness: 0.30, clearcoat: 0.7 }
    ],
    default_colorway: "noir",
    size_chart: [
      { size: "S", garment_chest_cm: 108, shoulder_cm: 45.0, sleeve_cm: 63, garment_length_cm: 114 },
      { size: "M", garment_chest_cm: 114, shoulder_cm: 47.0, sleeve_cm: 65, garment_length_cm: 116 },
      { size: "L", garment_chest_cm: 120, shoulder_cm: 49.0, sleeve_cm: 67, garment_length_cm: 119 },
      { size: "XL", garment_chest_cm: 126, shoulder_cm: 51.5, sleeve_cm: 68, garment_length_cm: 121 }
    ]
  },
  {
    id: "PROD_BLAZER_02",
    brand: "Sartoria Digital",
    category: "jacket",
    product_name: "Super 150s Structured Blazer",
    fabric: "Italian Worsted Wool & Cupro Lining",
    stretch_level: "none",
    fit_type: "slim",
    price: "EUR 1,220",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    description: "Sharp hand-canvassed chest construction with high armholes and suppressed waist contouring.",
    colorways: [
      { id: "noir", name: "Carbon Black", hex: "#0c0c0d", metalness: 0.75, roughness: 0.28, clearcoat: 0.8 },
      { id: "alabaster", name: "Ecru White", hex: "#f0ede6", metalness: 0.20, roughness: 0.40, clearcoat: 0.5 },
      { id: "midnight", name: "Abyssal Navy", hex: "#151c28", metalness: 0.80, roughness: 0.25, clearcoat: 0.85 }
    ],
    default_colorway: "noir",
    size_chart: [
      { size: "38R (S)", garment_chest_cm: 102, shoulder_cm: 44.5, sleeve_cm: 62.5, garment_length_cm: 74 },
      { size: "40R (M)", garment_chest_cm: 108, shoulder_cm: 46.0, sleeve_cm: 64.0, garment_length_cm: 76 },
      { size: "42R (L)", garment_chest_cm: 114, shoulder_cm: 47.5, sleeve_cm: 65.5, garment_length_cm: 77 },
      { size: "44R (XL)", garment_chest_cm: 120, shoulder_cm: 49.5, sleeve_cm: 66.5, garment_length_cm: 79 }
    ]
  },
  {
    id: "PROD_TSHIRT_03",
    brand: "FitMatch Minimal",
    category: "tshirt",
    product_name: "280 GSM Heavy Combed Cotton T-Shirt",
    fabric: "100% Long-Staple Combed Cotton",
    stretch_level: "medium",
    fit_type: "regular",
    price: "EUR 240",
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    description: "Dense tactile weight that falls cleanly without clinging. Seamless rib collar and reinforced double needle hem.",
    colorways: [
      { id: "noir", name: "Jet Void", hex: "#121214", metalness: 0.10, roughness: 0.85, clearcoat: 0.1 },
      { id: "alabaster", name: "Pure Chalk", hex: "#FAFAFC", metalness: 0.05, roughness: 0.90, clearcoat: 0.05 },
      { id: "charcoal", name: "Volcanic Grey", hex: "#2B2B30", metalness: 0.15, roughness: 0.80, clearcoat: 0.1 }
    ],
    default_colorway: "alabaster",
    size_chart: [
      { size: "S", garment_chest_cm: 104, shoulder_cm: 46.0, garment_length_cm: 70 },
      { size: "M", garment_chest_cm: 110, shoulder_cm: 48.0, garment_length_cm: 72 },
      { size: "L", garment_chest_cm: 116, shoulder_cm: 50.0, garment_length_cm: 74 },
      { size: "XL", garment_chest_cm: 122, shoulder_cm: 52.5, garment_length_cm: 76 }
    ]
  },
  {
    id: "PROD_SHIRT_04",
    brand: "Atelier FitMatch",
    category: "shirt",
    product_name: "Mulberry Silk Sartorial Shirt",
    fabric: "Pure Mulberry Silk Crepe de Chine",
    stretch_level: "low",
    fit_type: "slim",
    price: "EUR 620",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    description: "Fluid gossamer draping with clean hidden mother-of-pearl placket and crisp semi-spread collar.",
    colorways: [
      { id: "noir", name: "Onyx Silk", hex: "#0f0f11", metalness: 0.50, roughness: 0.20, clearcoat: 0.9 },
      { id: "champagne", name: "Raw Pearl", hex: "#EAE5D9", metalness: 0.40, roughness: 0.25, clearcoat: 0.85 }
    ],
    default_colorway: "noir",
    size_chart: [
      { size: "38 (S)", garment_chest_cm: 102, neck_cm: 39.0, shoulder_cm: 44.0, sleeve_cm: 63, garment_length_cm: 75 },
      { size: "40 (M)", garment_chest_cm: 108, neck_cm: 40.5, shoulder_cm: 45.5, sleeve_cm: 64, garment_length_cm: 77 },
      { size: "42 (L)", garment_chest_cm: 114, neck_cm: 42.0, shoulder_cm: 47.0, sleeve_cm: 66, garment_length_cm: 79 },
      { size: "44 (XL)", garment_chest_cm: 120, neck_cm: 43.5, shoulder_cm: 49.0, sleeve_cm: 67, garment_length_cm: 80 }
    ]
  },
  {
    id: "PROD_JEANS_05",
    brand: "Sartoria Digital",
    category: "jeans",
    product_name: "14oz Japanese Selvedge Denim Trouser",
    fabric: "Shuttle-Loom Kurabo Raw Indigo Denim",
    stretch_level: "low",
    fit_type: "regular",
    price: "EUR 490",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    description: "Mid-rise, straight leg architectural silhouette with zero pre-wash. Molds uniquely to customer gait.",
    colorways: [
      { id: "indigo", name: "Deep Raw Indigo", hex: "#161d2d", metalness: 0.30, roughness: 0.70, clearcoat: 0.2 },
      { id: "noir", name: "Sulfur Black", hex: "#18181a", metalness: 0.25, roughness: 0.75, clearcoat: 0.2 }
    ],
    default_colorway: "noir",
    size_chart: [
      { size: "30", garment_waist_cm: 80, garment_hip_cm: 98, thigh_cm: 58, inseam_cm: 82 },
      { size: "32", garment_waist_cm: 85, garment_hip_cm: 103, thigh_cm: 61, inseam_cm: 83 },
      { size: "34", garment_waist_cm: 90, garment_hip_cm: 108, thigh_cm: 64, inseam_cm: 84 },
      { size: "36", garment_waist_cm: 96, garment_hip_cm: 114, thigh_cm: 67, inseam_cm: 85 }
    ]
  }
];

