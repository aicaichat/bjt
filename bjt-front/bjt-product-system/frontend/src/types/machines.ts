// src/types/machines.ts
import { PriceTier, InventoryData } from './common'; // Assuming common types exist

export interface MachineProduct {
    id: number;
    code: string;
    name?: string;
    title_en: string;
    title_zh: string;
    subtitle?: string;
    description_en?: string;
    description_zh?: string;
    description?: string;
    image_url: string;
    image2_url?: string;
    explosion_diagram_pdf?: string;
    product_line_id?: number;
    type?: string;
    status?: string;
    sort_order?: number;
    created_at?: string;
    updated_at?: string;
    images?: string[];
    specs?: Record<string, string>;
    inventory?: Array<{region: string, amount: number}>;
    prices?: {
      base: number;
      tier1: number;
      tier2: number;
      vip: number;
    };
    features?: string[];
  }
  
  export interface MachineAccessory {
    id: string;
    product_line_id?: number;
    model?: string;
    brand?: string;
    part_number: string;
    name_zh: string;
    name_en: string;
    title: string;
    title_zh?: string;
    title_en?: string;
    spec?: string;
    spec_imperial?: string;
    voltage?: string;
    frequency?: string;
    package_size_cm?: string;
    package_size_inch?: string;
    net_weight_kg?: number;
    net_weight_lbs?: number;
    gross_weight_kg?: number;
    gross_weight_lbs?: number;
    pcs_per_box?: number;
    pallet_size_cm?: string;
    pallet_size_inch?: string;
    pcs_per_pallet?: number;
    pallet_height_cm?: number;
    pallet_height_inch?: number;
    pallet_gross_weight_kg?: number;
    pallet_gross_weight_lbs?: number;
    image_url: string;
    explosion_diagram_pdf?: string;
    spec_pdf?: string;
    level: number;
    parts: AccessoryPart[];
    parent_id?: string;
    compatible_machines?: string[];
    child_accessories?: MachineAccessory[];
    children?: MachineAccessory[];
    status?: string;
    unit?: string;
    created_at?: string;
    updated_at?: string;
    is_required?: boolean;
  }
  
  export interface AccessoryPart {
    id: string;
    part_number: string;
    title: string;
    specs: Record<string, string>;
    spec: string;
    spec_imperial: string;
    prices: {
      base: number;
      tier1: number;
      tier2: number;
      vip: number;
    };
    inventory: Array<{region: string, amount: number}>;
  }
  
  // Represents the structure of the 'data' field within a successful paginated API response
  export interface MachineListData {
    items: MachineProduct[];
    total: number;
    page: number;
    page_size: number; // Corresponds to 'per_page' in the backend JSON you provided
    total_pages: number;
  }

  // This interface represents the full raw response from the backend 
  // BEFORE HttpService unwraps response.data
  export interface RawAPIResponse<T> { 
    success: boolean;
    data: T; // For a list of machines, T would be MachineListData
    message?: string;
    code?: number;
  }

  // The PaginatedResponse type was causing confusion because HttpService.get returns the inner 'data' part.
  // Keeping it here commented out or for reference if some service does NOT unwrap.
  /*
  export interface PaginatedResponse<T> {
    success: boolean;
    data: {
      items: T[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    };
  }
  */

  // APIResponse can be used for single item fetches where HttpService also unwraps data
  // If the backend for a single item sends { success: true, data: MachineProduct },
  // then HttpService.get will return MachineProduct directly.
  // If the backend for a single item sends { success: true, data: { some_wrapper: MachineProduct } }, then T is { some_wrapper: MachineProduct }.
  // Based on your successful login, a single item (user) was wrapped in data: { token: ..., user: ... }
  // The current MachineController get_item returns { success: true, data: FormattedMachineItem }
  // So HttpService.get<FormattedMachineItem> would be appropriate for getMachine.
  export interface APIResponse<T> { // This now represents the unwrapped data for single items if backend sends { success: true, data: T }
    success: boolean; // This field will NOT be present after HttpService.get unwraps if T is the direct data.
    data: T; // This field will NOT be present after HttpService.get unwraps if T is the direct data.
             // This type needs rethinking if used with HttpService that unwraps to T directly.
             // Let's assume for getMachine, T will be MachineProduct directly.
    message?: string;
    code?: number;
  }

  /**
   * Represents a specific, purchasable host machine part/variant.
   * Combines data from wp_bjt_parts and its parent wp_bjt_host_models.
   */
  export interface MachinePart {
    // --- From wp_bjt_parts ---
    id: number; // The ID from wp_bjt_parts
    product_line_id: number;
    part_number: string;
    voltage: string | null;
    image_url: string | null; // Part-specific image (if different from model)
    name_zh: string; // Name from wp_bjt_parts
    name_en: string; // Name from wp_bjt_parts
    brand: string | null;
    spec: string | null; // Spec from wp_bjt_parts
    spec_imperial: string | null;
    package_size_cm: string | null;
    package_size_inch: string | null;
    net_weight_kg: number | null;
    net_weight_lbs: number | null;
    gross_weight_kg: number | null;
    gross_weight_lbs: number | null;
    pcs_per_box: number | null;
    pallet_size_cm: string | null;
    pallet_size_inch: string | null;
    pcs_per_pallet: number | null;
    pallet_height_cm: number | null;
    pallet_height_inch: number | null;
    pallet_gross_weight_kg: number | null;
    pallet_gross_weight_lbs: number | null;
    status: string;
    unit: string;
    created_at?: string;
    updated_at?: string;

    // --- From parent wp_bjt_host_models ---
    model: string; // Model code (e.g., 'LA-E4S') - links the part to the model
    model_title_zh: string; // Title from host_models
    model_title_en: string; // Title from host_models
    model_description_zh: string | null;
    model_description_en: string | null;
    model_type: string | null; // e.g., '小型', '中型'
    model_image1_url: string | null; // Main image from host_models
    model_image2_url: string | null; // Secondary image from host_models
    model_explosion_diagram_pdf: string | null;
    /** From API: part + host model images, deduplicated (optional). */
    gallery_image_urls?: string[];

    // --- Pricing & Inventory (to be populated) ---
    prices: PriceTier[]; 
    inventory: InventoryData[];
  }

  // Add/Update list data interface if needed to return MachinePart[]
  export interface MachinePartListData {
    items: MachinePart[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    // Add filter options if applicable for parts
  }