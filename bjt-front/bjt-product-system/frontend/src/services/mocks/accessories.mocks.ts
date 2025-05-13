import { MachineAccessory, AccessoryPart } from '../types/machines';
import { PriceTier, getAccessoryPartPrices } from './prices.mocks'; 
import { InventoryData, getAccessoryPartInventory } from './inventory.mocks'; 

// --- Accessory Models Mock Data --- 
// Based on wp_bjt_accessory_models
// Note: The MachineAccessory type includes a 'parts' array and optional 'children' 
// which are populated by the relations logic, not directly defined here.
interface AccessoryModelRecord {
  id: number;
  product_line_id: number;
  model: string;
  title_zh: string;
  title_en: string;
  description_zh: string | null;
  description_en: string | null;
  type: string | null;
  image1_url: string | null;
  image2_url: string | null;
  explosion_diagram_pdf: string | null;
  status: string;
  sort_order: number | null;
}

const mockAccessoryModels: AccessoryModelRecord[] = [
  { id: 1, product_line_id: 1, model: 'E4S-FAN', title_zh: 'E4S风扇', title_en: 'E4S Fan', description_zh: 'E4S主机专用风扇', description_en: 'Fan for E4S host', type: '风扇', image1_url: '/images/shop/LA-E4S.jpg', image2_url: '/images/shop/LA-E5P.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-FAN.pdf', status: 'publish', sort_order: 10 },
  { id: 2, product_line_id: 1, model: 'E4S-CTRL', title_zh: 'E4S控制板', title_en: 'E4S Controller', description_zh: 'E4S主机智能控制板', description_en: 'Smart controller for E4S', type: '控制板', image1_url: '/images/shop/LA-E5P.jpg', image2_url: '/images/shop/LA-E4C.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-CTRL.pdf', status: 'publish', sort_order: 20 },
  { id: 3, product_line_id: 1, model: 'E4S-HEATER', title_zh: 'E4S加热器', title_en: 'E4S Heater', description_zh: 'E4S主机加热组件', description_en: 'Heater for E4S', type: '加热器', image1_url: '/images/shop/LA-E4C.jpg', image2_url: '/images/shop/MPV.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-HEATER.pdf', status: 'publish', sort_order: 30 },
  // ... add all accessory models from mockup.sql ...
  { id: 15, product_line_id: 4, model: 'ACB100-VALVE-CHILD', title_zh: 'ACB100气阀子件', title_en: 'ACB100 Valve Child', description_zh: 'ACB100气阀下属子配件', description_en: 'Child part of ACB100 valve', type: '气阀子件', image1_url: '/images/shop/LA-E4S.jpg', image2_url: '/images/shop/MPV.jpg', explosion_diagram_pdf: '/pdfs/accessories/ACB100-VALVE-CHILD.pdf', status: 'publish', sort_order: 20 }
];

// --- Accessory Parts Mock Data ---
// Based on wp_bjt_accessories
interface AccessoryPartRecord {
  id: number;
  product_line_id: number;
  model: string; // Accessory Model this part belongs to
  brand: string | null;
  part_number: string;
  name_zh: string;
  name_en: string;
  spec: string | null;
  spec_imperial: string | null;
  voltage: string | null;
  frequency: string | null;
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
  image_url: string | null;
  status: string;
  unit: string; // pcs/roll/box
}

const mockAccessoryParts: AccessoryPartRecord[] = [
  { id: 1, product_line_id: 1, model: 'E4S-FAN', brand: 'BJT', part_number: 'A10001', name_zh: 'E4S风扇组件', name_en: 'E4S Fan Assembly', spec: '12x8x6cm', spec_imperial: '4.7x3.1x2.4in', voltage: '220V', frequency: '50Hz', package_size_cm: null, package_size_inch: null, net_weight_kg: null, net_weight_lbs: null, gross_weight_kg: null, gross_weight_lbs: null, pcs_per_box: null, pallet_size_cm: null, pallet_size_inch: null, pcs_per_pallet: null, pallet_height_cm: null, pallet_height_inch: null, pallet_gross_weight_kg: null, pallet_gross_weight_lbs: null, image_url: '/images/shop/LA-E4S.jpg', status: 'publish', unit: 'pcs' },
  { id: 2, product_line_id: 1, model: 'E4S-FAN', brand: 'BJT', part_number: 'A10002', name_zh: 'E4S风扇组件-美规', name_en: 'E4S Fan Assembly-US', spec: '12x8x6cm', spec_imperial: '4.7x3.1x2.4in', voltage: '110V', frequency: '60Hz', package_size_cm: null, package_size_inch: null, net_weight_kg: null, net_weight_lbs: null, gross_weight_kg: null, gross_weight_lbs: null, pcs_per_box: null, pallet_size_cm: null, pallet_size_inch: null, pcs_per_pallet: null, pallet_height_cm: null, pallet_height_inch: null, pallet_gross_weight_kg: null, pallet_gross_weight_lbs: null, image_url: '/images/shop/LA-E5P.jpg', status: 'publish', unit: 'pcs' },
  { id: 3, product_line_id: 1, model: 'E4S-CTRL', brand: 'BJT', part_number: 'A20001', name_zh: 'E4S控制板组件', name_en: 'E4S Controller Assembly', spec: '10x8x3cm', spec_imperial: '3.9x3.1x1.2in', voltage: '220V', frequency: '50Hz', package_size_cm: null, package_size_inch: null, net_weight_kg: null, net_weight_lbs: null, gross_weight_kg: null, gross_weight_lbs: null, pcs_per_box: null, pallet_size_cm: null, pallet_size_inch: null, pcs_per_pallet: null, pallet_height_cm: null, pallet_height_inch: null, pallet_gross_weight_kg: null, pallet_gross_weight_lbs: null, image_url: '/images/shop/LA-E5P.jpg', status: 'publish', unit: 'pcs' },
  // ... add all accessory parts from mockup.sql ...
  { id: 10, product_line_id: 4, model: 'ACB100-VALVE', brand: 'BJT', part_number: 'D10001', name_zh: 'ACB100气阀组件', name_en: 'ACB100 Valve Assembly', spec: '6x3x3cm', spec_imperial: '2.4x1.2x1.2in', voltage: '220V', frequency: '50Hz', package_size_cm: null, package_size_inch: null, net_weight_kg: null, net_weight_lbs: null, gross_weight_kg: null, gross_weight_lbs: null, pcs_per_box: null, pallet_size_cm: null, pallet_size_inch: null, pcs_per_pallet: null, pallet_height_cm: null, pallet_height_inch: null, pallet_gross_weight_kg: null, pallet_gross_weight_lbs: null, image_url: '/images/shop/MPV.jpg', status: 'publish', unit: 'pcs' }
];


// --- Helper Functions --- 

/**
 * Finds an accessory part record by its part number.
 */
export const getAccessoryPartRecordByPartNumber = (partNumber: string): AccessoryPartRecord | undefined => {
  return mockAccessoryParts.find(p => p.part_number === partNumber);
};

/**
 * Finds an accessory model record by its model code.
 */
export const getAccessoryModelRecordByModel = (modelCode: string): AccessoryModelRecord | undefined => {
    return mockAccessoryModels.find(m => m.model === modelCode);
}

/**
 * Finds an accessory part by its part number and combines it with price and inventory data.
 * This is likely needed by the relations logic.
 */
export const getAccessoryPartByPartNumber = (partNumber: string): AccessoryPart | undefined => {
  const partRecord = getAccessoryPartRecordByPartNumber(partNumber);
  if (!partRecord) {
    return undefined;
  }

  const prices = getAccessoryPartPrices(partRecord.id, partRecord.product_line_id);
  const inventory = getAccessoryPartInventory(partRecord.id, partRecord.product_line_id);

  // Map AccessoryPartRecord to AccessoryPart type
  return {
    id: partRecord.id,
    part_number: partRecord.part_number,
    name_zh: partRecord.name_zh,
    name_en: partRecord.name_en,
    spec: partRecord.spec ?? undefined,
    spec_imperial: partRecord.spec_imperial ?? undefined,
    voltage: partRecord.voltage ?? undefined,
    frequency: partRecord.frequency ?? undefined,
    image_url: partRecord.image_url ?? undefined,
    status: partRecord.status,
    unit: partRecord.unit,
    prices: prices, 
    inventory: inventory,
    // Note: Missing fields like package size, weight etc. are not in AccessoryPart type in machines.ts
    // If needed, the AccessoryPart type should be updated.
  };
};

/**
 * Finds all accessory parts associated with a specific accessory model code.
 */
export const getAccessoryPartsByModel = (modelCode: string): AccessoryPart[] => {
  return mockAccessoryParts
    .filter(p => p.model === modelCode)
    .map(p => getAccessoryPartByPartNumber(p.part_number)) // Reuse the function to get full part data
    .filter((p): p is AccessoryPart => p !== undefined); // Type guard to filter out undefined results
};

/**
 * Finds an accessory model by its model code and fetches its associated parts.
 * This might be used directly by UI components.
 */
export const getAccessoryModelByCode = (modelCode: string): Omit<MachineAccessory, 'children'> | undefined => {
    const modelRecord = getAccessoryModelRecordByModel(modelCode);
    if (!modelRecord) {
        return undefined;
    }

    const parts = getAccessoryPartsByModel(modelCode);

    // Map AccessoryModelRecord to MachineAccessory (omitting children, which are handled by relations)
    return {
        id: modelRecord.id, // Use model ID here
        product_line_id: modelRecord.product_line_id,
        model: modelRecord.model,
        title_zh: modelRecord.title_zh,
        title_en: modelRecord.title_en,
        description_zh: modelRecord.description_zh ?? undefined,
        description_en: modelRecord.description_en ?? undefined,
        type: modelRecord.type ?? undefined,
        image1_url: modelRecord.image1_url ?? undefined,
        image2_url: modelRecord.image2_url ?? undefined,
        explosion_diagram_pdf: modelRecord.explosion_diagram_pdf ?? undefined,
        status: modelRecord.status,
        sort_order: modelRecord.sort_order ?? undefined,
        parts: parts, // Attach the fetched parts
    };
} 