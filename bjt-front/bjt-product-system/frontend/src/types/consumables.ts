// This file defines the structure for consumable product data.

// Represents pricing tiers based on quantity and region.
export interface ConsumablePriceTier {
  range: string; // e.g., '1-10', '11+' (from backend)
  price: number; // Default price for the tier (e.g., for CN region)
  regionalPrices: { eu: number; na: number; au: number; cn: number }; // Map of region code to price for this tier
  min_quantity?: number; // Optional: if range is not enough, for logic
  max_quantity?: number | null; // Optional: if range is not enough, for logic
}

// Represents inventory details for a specific region and warehouse.
// For the main Consumable object, we'll use a simpler region-to-quantity map
// This detailed interface might be used for more specific inventory views if needed.
export interface ConsumableInventoryDetail {
  region: string; // e.g., 'CN', 'US', 'EU', 'AU'
  warehouse: string; // e.g., 'WH-SH-01', 'WH-US-01'
  quantity: number; // Available quantity
  reserved: number; // Reserved quantity
}

// Represents specifications for a consumable, matching backend's 'specs' object
export interface ConsumableSpecs {
  material?: string | null;
  shape?: string | null; // Corresponds to backend's bag_type
  thickness?: string | null; // e.g., "25 um"
  width?: string | null; // e.g., "200 mm"
  length?: string | null; // e.g., "500 m"
  rollLength?: string | null; // e.g., "700 m"
  compatibility?: string | null; // Corresponds to backend's app_model
  // Add other spec fields from backend's format_item_for_response if needed
  // e.g. bubble_diameter, etc.
}

// Represents a single consumable product.
export interface Consumable {
  id: number | string; // Unique identifier from wp_bjt_consumables
  product_line_id: number; // Link to wp_bjt_product_lines
  // Fields directly from backend response (after format_item_for_response)
  code: string; // part_number from backend
  name: string; // model from backend
  model: string; // model from backend (often same as name)
  model_imperial?: string | null;
  brand?: string | null;
  sales_unit?: string | null; // package_type from backend
  image_url?: string | null;
  status: string; // e.g., 'publish', 'draft'
  // 'unit' was in old mock data, backend uses 'sales_unit' (package_type)
  // unit_price was in old mock data, now part of 'pricing'
  // stock was in old mock data, now part of 'inventory'

  specs: ConsumableSpecs;
  pricing: ConsumablePriceTier[]; // Array of tier objects from backend
  inventory: { [key: string]: number }; // Region to quantity map, e.g., { "CN": 100, "EU": 50 }

  // Fields from init.sql table structure (wp_bjt_consumables) that are NOT directly in format_item_for_response top level
  // These are kept for potential future use or if backend response changes, but primary source is what format_item_for_response builds.
  // Many of these are used to build the 'specs' object in the backend.
  part_number: string; // Available as 'code' in formatted response
  // app_model is in specs.compatibility
  // bag_type is in specs.shape
  // material is in specs.material
  // thickness_met, width_met, length_met, total_length_met are used for specs.thickness etc.
  spec?: string | null; // Generic spec strings, if needed
  spec_imperial?: string | null;
  
  package_type?: string | null; // Available as 'sales_unit' in formatted response
  package_size_cm?: string | null;
  package_size_inch?: string | null;
  net_weight_kg?: number | null;
  net_weight_lbs?: number | null;
  gross_weight_kg?: number | null;
  gross_weight_lbs?: number | null;
  pcs_per_box?: number | null;
  package_image_url?: string | null;
  pallet_size_cm?: string | null;
  pallet_size_inch?: string | null;
  pcs_per_pallet_a?: number | null;
  pallet_gross_weight_a_kg?: number | null;
  pallet_gross_weight_a_lbs?: number | null;
  pallet_height_a_cm?: number | null;
  pallet_height_a_inch?: number | null;
  pcs_per_pallet_b?: number | null;
  pallet_gross_weight_b_kg?: number | null;
  pallet_gross_weight_b_lbs?: number | null;
  pallet_height_b_cm?: number | null;
  pallet_height_b_inch?: number | null;
  pcs_per_pallet_c?: number | null;
  pallet_gross_weight_c_kg?: number | null;
  pallet_gross_weight_c_lbs?: number | null;
  pallet_height_c_cm?: number | null;
  pallet_height_c_inch?: number | null;
  tube_inner_diameter_cm?: number | null;
  tube_inner_diameter_inch?: number | null;
  updated_at?: string; // ISO date string

  // Populated by helper functions in mock data
  productId?: string; // Often same as part_number for frontend use
}

// Represents the available filter options for consumables.
export interface ConsumableFilterOptions {
  app_model?: string[];
  bag_type?: string[];
  material?: string[];
  thickness_met?: number[];
  thickness_imp?: number[];
  width_met?: number[];
  width_imp?: number[];
  length_met?: number[];
  length_imp?: number[];
}

// Represents the structure for API responses returning a list of consumables.
export interface ConsumableListData {
  items: Consumable[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  filterOptions?: ConsumableFilterOptions; // Available options for filters
} 