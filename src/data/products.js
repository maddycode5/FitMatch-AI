/**
 * FitMatch AI Luxury Product Catalog & Size Charts
 * Represents real garments from The Virtual Archive.
 * Note: Measurements represent true physical GARMENT dimensions, not body sizes.
 */

export const LUXURY_PRODUCTS = [
  {
    id: "PROD_BLAZER_01",
    brand: "Atelier FitMatch",
    category: "jacket",
    product_name: "Monochrome Cashmere Blazer & Suit",
    fabric: "Super 150s Worsted Check Wool & Silk Tie",
    matchScore: "99.8%",
    stretch_level: "none",
    fit_type: "slim",
    price: "EUR 1,650",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    description: "Bespoke 3-piece check tailoring with structured hand-canvassed chest, peak lapels, tailored waistcoat, and silk tie.",
    colorways: [
      { id: "charcoal", name: "Charcoal Check", hex: "#222428", metalness: 0.35, roughness: 0.70, clearcoat: 0.2 },
      { id: "noir", name: "Midnight Noir", hex: "#111114", metalness: 0.40, roughness: 0.65, clearcoat: 0.2 },
      { id: "camel", name: "Savile Camel", hex: "#786252", metalness: 0.30, roughness: 0.75, clearcoat: 0.2 }
    ],
    default_colorway: "charcoal",
    size_chart: [
      { size: "38R (S)", garment_chest_cm: 102, shoulder_cm: 44.5, sleeve_cm: 62.5, garment_length_cm: 74 },
      { size: "40R (M)", garment_chest_cm: 108, shoulder_cm: 46.0, sleeve_cm: 64.0, garment_length_cm: 76 },
      { size: "42R (L)", garment_chest_cm: 114, shoulder_cm: 47.5, sleeve_cm: 65.5, garment_length_cm: 77 },
      { size: "44R (XL)", garment_chest_cm: 120, shoulder_cm: 49.5, sleeve_cm: 66.5, garment_length_cm: 79 }
    ]
  },
  {
    id: "PROD_SHIRT_02",
    brand: "Atelier FitMatch",
    category: "shirt",
    product_name: "Sculptural Asymmetric Drape Shirt",
    fabric: "Crisp Pure Egyptian Cotton & Polka Dot Silk Tie",
    matchScore: "98.5%",
    stretch_level: "low",
    fit_type: "slim",
    price: "EUR 620",
    image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    description: "Tailored white dress shirt with spread collar, navy polka-dot silk tie, hidden mother-of-pearl placket, and barrel cuffs.",
    colorways: [
      { id: "white", name: "Crisp Chalk White", hex: "#F5F6F8", metalness: 0.05, roughness: 0.85, clearcoat: 0.1 },
      { id: "sky", name: "Glacier Blue", hex: "#D4DFE8", metalness: 0.05, roughness: 0.85, clearcoat: 0.1 },
      { id: "noir", name: "Onyx Silk", hex: "#141518", metalness: 0.20, roughness: 0.80, clearcoat: 0.2 }
    ],
    default_colorway: "white",
    size_chart: [
      { size: "38 (S)", garment_chest_cm: 102, neck_cm: 39.0, shoulder_cm: 44.0, sleeve_cm: 63, garment_length_cm: 75 },
      { size: "40 (M)", garment_chest_cm: 108, neck_cm: 40.5, shoulder_cm: 45.5, sleeve_cm: 64, garment_length_cm: 77 },
      { size: "42 (L)", garment_chest_cm: 114, neck_cm: 42.0, shoulder_cm: 47.0, sleeve_cm: 66, garment_length_cm: 79 },
      { size: "44 (XL)", garment_chest_cm: 120, neck_cm: 43.5, shoulder_cm: 49.0, sleeve_cm: 67, garment_length_cm: 80 }
    ]
  },
  {
    id: "PROD_PANTS_03",
    brand: "Sartoria Digital",
    category: "jeans",
    product_name: "Pleated Minimalist Pantalon",
    fabric: "High-Waisted Pinstripe Pleated Tailored Wool",
    matchScore: "99.1%",
    stretch_level: "low",
    fit_type: "regular",
    price: "EUR 840",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80",
    description: "Architectural high-waisted wide-leg pinstripe trousers with double front pleats and fluid tailoring drape.",
    colorways: [
      { id: "pinstripe", name: "Noir Pinstripe", hex: "#18191D", metalness: 0.25, roughness: 0.75, clearcoat: 0.2 },
      { id: "navy", name: "Navy Pinstripe", hex: "#161B28", metalness: 0.25, roughness: 0.75, clearcoat: 0.2 }
    ],
    default_colorway: "pinstripe",
    size_chart: [
      { size: "30", garment_waist_cm: 80, garment_hip_cm: 98, thigh_cm: 58, inseam_cm: 82 },
      { size: "32", garment_waist_cm: 85, garment_hip_cm: 103, thigh_cm: 61, inseam_cm: 83 },
      { size: "34", garment_waist_cm: 90, garment_hip_cm: 108, thigh_cm: 64, inseam_cm: 84 },
      { size: "36", garment_waist_cm: 96, garment_hip_cm: 114, thigh_cm: 67, inseam_cm: 85 }
    ]
  },
  {
    id: "PROD_TRENCH_04",
    brand: "Atelier FitMatch",
    category: "jacket",
    product_name: "The Sculptural Minimalist Trench",
    fabric: "Heavyweight Double-Weave Silk-Wool (420 GSM)",
    matchScore: "99.4%",
    stretch_level: "low",
    fit_type: "regular",
    price: "EUR 1,480",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    description: "An architectural outerwear masterpiece with structured raglan sleeves, micro-crease dynamics, and drop-shoulder drape.",
    colorways: [
      { id: "noir", name: "Void Noir", hex: "#111113", metalness: 0.85, roughness: 0.22, clearcoat: 0.9 },
      { id: "alabaster", name: "Alabaster Chalk", hex: "#EBEBEB", metalness: 0.25, roughness: 0.35, clearcoat: 0.6 },
      { id: "camel", name: "Desert Camel", hex: "#A88B73", metalness: 0.40, roughness: 0.45, clearcoat: 0.4 }
    ],
    default_colorway: "noir",
    size_chart: [
      { size: "S", garment_chest_cm: 108, shoulder_cm: 45.0, sleeve_cm: 63, garment_length_cm: 114 },
      { size: "M", garment_chest_cm: 114, shoulder_cm: 47.0, sleeve_cm: 65, garment_length_cm: 116 },
      { size: "L", garment_chest_cm: 120, shoulder_cm: 49.0, sleeve_cm: 67, garment_length_cm: 119 },
      { size: "XL", garment_chest_cm: 126, shoulder_cm: 51.5, sleeve_cm: 68, garment_length_cm: 121 }
    ]
  }
];
