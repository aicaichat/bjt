// Consumable Field Display Configuration
// Based on output/display-fields.json standard, supports smart unit systems and multilingual

export const CONSUMABLE_DISPLAY_CONFIG = {
  // JSON standard field mapping
  STANDARD_FIELDS: {
    // Product list display fields (10 standard fields)
    PRODUCT_LIST: [
      'app_model',          // Compatible model
      'name',               // Product name (English requirement)
      'shape',              // Shape
      'image_url',          // Product image
      'code',               // Part number
      'model',              // Model (metric/imperial smart selection)
      'spec',               // Specification (metric/imperial smart selection)
      'bubble_diameter',    // Bubble diameter (cm/inch smart selection)
      'id',                 // Product ID
      'pcs_per_box'         // Pieces per box
    ],
    
    // Cart display fields (9 standard fields)
    CART: [
      'app_model',          // Compatible model
      'name',               // Product name (English requirement)
      'image_url',          // Product image
      'code',               // Part number
      'model',              // Model (metric/imperial smart selection)
      'spec',               // Specification (metric/imperial smart selection)
      'bubble_diameter',    // Bubble diameter (cm/inch smart selection)
      'id',                 // Product ID
      'pcs_per_box'         // Pieces per box
    ],
    
    // Tooltip display fields (23 standard fields)
    TOOLTIP: [
      'material',           // Material
      'thickness',          // Thickness/weight (um/gsm or mil/# smart selection)
      'width',              // Film width (cm/inch smart selection)
      'length',             // Bag length (cm/inch smart selection)
      'name',               // Product name (English requirement)
      'total_length',       // Total length (m/ft smart selection)
      'package_type',       // Packaging type
      'package_size',       // Package size (cm/inch smart selection)
      'net_weight',         // Unit weight (kg/lbs smart selection)
      'package_image_url',  // Package image
      'pallet_size',        // Pallet size (cm/inch smart selection)
      'pcs_per_pallet_a',   // Pallet rolls A
      'pallet_gross_weight_a', // Pallet gross weight A (kg/lbs smart selection)
      'pallet_height_a',    // Pallet height A (cm/inch smart selection)
      'pcs_per_pallet_b',   // Pallet rolls B
      'pallet_gross_weight_b', // Pallet gross weight B (kg/lbs smart selection)
      'pallet_height_b',    // Pallet height B (cm/inch smart selection)
      'pcs_per_pallet_c',   // Pallet rolls C
      'pallet_gross_weight_c', // Pallet gross weight C (kg/lbs smart selection)
      'pallet_height_c',    // Pallet height C (cm/inch smart selection)
      'tube_inner_diameter' // Core inner diameter (cm/inch smart selection)
    ],
    
    // PO page display fields (8 standard fields)
    PO_PAGE: [
      'name',               // Product name (English requirement)
      'code',               // Part number
      'model',              // Model (metric/imperial smart selection)
      'spec',               // Specification (metric/imperial smart selection)
      'brand',              // Brand
      'id'                  // Product ID
    ]
  },
  
  // Smart unit system field configuration (based on preferred_unit preference)
  UNIT_FIELDS: {
    // Dimension related fields
    model: { 
      metric: 'model', 
      imperial: 'model_imperial',
      fieldType: 'text'
    },
    spec: { 
      metric: 'spec', 
      imperial: 'spec_imperial',
      fieldType: 'text'
    },
    bubble_diameter: { 
      metric: 'bubble_diameter_met', 
      imperial: 'bubble_diameter_imp',
      fieldType: 'number'
    },
    thickness: { 
      metric: 'thickness_met', 
      imperial: 'thickness_imp',
      fieldType: 'number'
    },
    width: { 
      metric: 'width_met', 
      imperial: 'width_imp',
      fieldType: 'number'
    },
    length: { 
      metric: 'length_met', 
      imperial: 'length_imp',
      fieldType: 'number'
    },
    total_length: { 
      metric: 'total_length_met', 
      imperial: 'total_length_imp',
      fieldType: 'number'
    },
    package_size: { 
      metric: 'package_size_cm', 
      imperial: 'package_size_inch',
      fieldType: 'dimension'  // Composite dimension format
    },
    
    // Weight related fields
    net_weight: { 
      metric: 'net_weight_kg', 
      imperial: 'net_weight_lbs',
      fieldType: 'number'
    },
    gross_weight: { 
      metric: 'gross_weight_kg', 
      imperial: 'gross_weight_lbs',
      fieldType: 'number'
    },
    pallet_gross_weight_a: { 
      metric: 'pallet_gross_weight_a_kg', 
      imperial: 'pallet_gross_weight_a_lbs',
      fieldType: 'number'
    },
    pallet_height_a: { 
      metric: 'pallet_height_a_cm', 
      imperial: 'pallet_height_a_inch',
      fieldType: 'number'
    },
    pallet_gross_weight_b: { 
      metric: 'pallet_gross_weight_b_kg', 
      imperial: 'pallet_gross_weight_b_lbs',
      fieldType: 'number'
    },
    pallet_height_b: { 
      metric: 'pallet_height_b_cm', 
      imperial: 'pallet_height_b_inch',
      fieldType: 'number'
    },
    pallet_gross_weight_c: { 
      metric: 'pallet_gross_weight_c_kg', 
      imperial: 'pallet_gross_weight_c_lbs',
      fieldType: 'number'
    },
    pallet_height_c: { 
      metric: 'pallet_height_c_cm', 
      imperial: 'pallet_height_c_inch',
      fieldType: 'number'
    },
    pallet_size: { 
      metric: 'pallet_size_cm', 
      imperial: 'pallet_size_inch',
      fieldType: 'dimension'
    },
    tube_inner_diameter: { 
      metric: 'tube_inner_diameter_cm', 
      imperial: 'tube_inner_diameter_inch',
      fieldType: 'number'
    }
  },
  
  // Conditional display rules
  CONDITIONAL_FIELDS: {
    // Bubble diameter only shows for bubble-related shapes
    bubble_diameter: {
      condition: (item: any) => ['bubble', 'pillow', '气泡膜', '气泡枕'].includes(item.shape?.toLowerCase())
    }
  }
};

// Feature flag configuration
export const FEATURE_FLAGS = {
  ENABLE_STANDARD_FIELDS: import.meta.env.VITE_ENABLE_STANDARD_FIELDS === 'true' || true,
  ENABLE_SMART_UNITS: import.meta.env.VITE_ENABLE_SMART_UNITS === 'true' || true,
  ENABLE_MULTILANG: import.meta.env.VITE_ENABLE_MULTILANG === 'true' || true
}; 