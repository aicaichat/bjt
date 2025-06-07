import { PriceTier } from '../../types/common';
import { InventoryData } from '../../types/common';
import { SparePart } from '../../types/spareParts';
import { getSparePartPrices } from './prices.mocks'; 
import { getSparePartInventory } from './inventory.mocks'; 
import rawSparePartRecords from './data/spareParts.data.json'; // <-- Import JSON data

interface SparePartRecord {
  id: number;
  product_line_id: number;
  app_model: string | null;
  model: string; // Corresponds to model in wp_bjt_spare_part_models
  is_consumable: number; // 0 or 1 in DB
  image_url: string | null;
  part_number: string;
  name_zh: string;
  name_en: string;
  spec: string | null;
  spec_imperial: string | null;
  app_sn: string | null;
  package_size_cm: string | null;
  package_size_inch: string | null;
  net_weight_kg: number | null;
  net_weight_lbs: number | null;
  gross_weight_kg: number | null;
  gross_weight_lbs: number | null;
  pcs_per_box: number | null;
  required_parts: string | null; // Comma-separated part numbers
  required_quantity: string | null; // Comma-separated quantities
  status: string;
  unit: string;
}

// Use the imported data, asserting its type
const mockSparePartRecords: SparePartRecord[] = rawSparePartRecords as SparePartRecord[];

/**
 * Finds a spare part by its part number and combines it with price and inventory data.
 * Returns an object matching the canonical SparePart type from types/spareParts.ts
 */
export const getSparePartByPartNumber = (partNumber: string): SparePart | undefined => {
  const record = mockSparePartRecords.find(sp => sp.part_number === partNumber);
  if (!record) {
    return undefined;
  }

  const prices: PriceTier[] = getSparePartPrices(record.id, record.product_line_id);
  const inventory: InventoryData[] = getSparePartInventory(record.id, record.product_line_id);

  // Map SparePartRecord to the canonical SparePart type
  const sparePart: SparePart = {
    id: record.id, // Keep as number
    product_line_id: record.product_line_id,
    app_model: record.app_model,
    model: record.model,
    is_consumable: record.is_consumable, // 保持原始数字值：1=易损，2=非易损，3=隐藏
    image_url: record.image_url,
    part_number: record.part_number,
    name_zh: record.name_zh,
    name_en: record.name_en,
    spec: record.spec,
    spec_imperial: record.spec_imperial,
    app_sn: record.app_sn,
    package_size_cm: record.package_size_cm,
    package_size_inch: record.package_size_inch,
    net_weight_kg: record.net_weight_kg,
    net_weight_lbs: record.net_weight_lbs,
    gross_weight_kg: record.gross_weight_kg,
    gross_weight_lbs: record.gross_weight_lbs,
    pcs_per_box: record.pcs_per_box,
    status: record.status,
    unit: record.unit,
    prices: prices,
    inventory: inventory,
    product_type: record.product_line_id === 1 ? 'machine' : 'accessory', // Example mapping
  };
  
  return sparePart;
};

/**
 * Retrieves all mock spare parts, fully populated with price and inventory.
 * The returned objects match the canonical SparePart type.
 */
export const getAllMockSpareParts = (): SparePart[] => {
    return mockSparePartRecords.map(record => getSparePartByPartNumber(record.part_number)).filter(sp => sp !== undefined) as SparePart[];
}; 