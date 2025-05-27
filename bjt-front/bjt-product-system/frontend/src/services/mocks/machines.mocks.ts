import { MachinePart, MachineAccessory, AccessoryPart, MachinePartListData } from '../../types/machines';
import { PriceTier } from '../../types/common'; // Assuming PriceTier is in common
import { InventoryData } from '../../types/common'; // Assuming InventoryData is in common
import mockRelations from './data/relations.data.json';
import mockAccessoryModels from './data/accessoryModels.data.json';
import mockAccessories from './data/accessories.data.json';
import mockAccessoryPrices from './data/accessoryPrices.data.json';
import mockAccessoryInventory from './data/accessoryInventory.data.json';
import hostModelsData from './data/hostModels.data.json';
import rawMachinePartsData from './data/machineParts.data.json';
import pricesData from './data/prices.data.json';
import inventoryData from './data/inventory.data.json';
// TODO: Update import paths if PriceTier/InventoryData are elsewhere

// --- Mock Data based on mockup.sql ---

// wp_bjt_relations (filtered for accessory children)
// const mockRelations = [
//   { id: 1, product_line_id: 1, parent_part_number: '13A00001', child_part_number: 'A10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
//   { id: 2, product_line_id: 1, parent_part_number: 'A10001', child_part_number: 'A40001', child_type: 'accessory', level: 2, quantity: 1, required_parts: null, required_quantity: null, sort_order: 20, status: 'publish' },
//   { id: 7, product_line_id: 2, parent_part_number: '23P00001', child_part_number: 'B10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
//   { id: 13, product_line_id: 3, parent_part_number: '33T00001', child_part_number: 'C10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
//   { id: 19, product_line_id: 4, parent_part_number: '43B00001', child_part_number: 'D10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
// ];

// wp_bjt_accessory_models
// const mockAccessoryModels = [
//   { id: 1, product_line_id: 1, model: 'E4S-FAN', title_zh: 'E4S风扇', title_en: 'E4S Fan', description_zh: 'E4S主机专用风扇', description_en: 'Fan for E4S host', type: '风扇', image1_url: '/images/shop/LA-E4S.jpg', image2_url: '/images/shop/LA-E5P.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-FAN.pdf', status: 'publish', sort_order: 10 },
//   { id: 2, product_line_id: 1, model: 'E4S-CTRL', title_zh: 'E4S控制板', title_en: 'E4S Controller', description_zh: 'E4S主机智能控制板', description_en: 'Smart controller for E4S', type: '控制板', image1_url: '/images/shop/LA-E5P.jpg', image2_url: '/images/shop/LA-E4C.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-CTRL.pdf', status: 'publish', sort_order: 20 },
//   { id: 3, product_line_id: 1, model: 'E4S-HEATER', title_zh: 'E4S加热器', title_en: 'E4S Heater', description_zh: 'E4S主机加热组件', description_en: 'Heater for E4S', type: '加热器', image1_url: '/images/shop/LA-E4C.jpg', image2_url: '/images/shop/MPV.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-HEATER.pdf', status: 'publish', sort_order: 30 },
//   { id: 6, product_line_id: 1, model: 'E4S-FAN-CHILD', title_zh: 'E4S风扇子件', title_en: 'E4S Fan Child', description_zh: 'E4S风扇下属子配件', description_en: 'Child part of E4S fan', type: '风扇子件', image1_url: '/images/shop/LA-E5P.jpg', image2_url: '/images/shop/LA-E4C.jpg', explosion_diagram_pdf: '/pdfs/accessories/E4S-FAN-CHILD.pdf', status: 'publish', sort_order: 60 },
//   { id: 9, product_line_id: 2, model: 'PM100-CUTTER', title_zh: 'PM100切刀', title_en: 'PM100 Cutter', description_zh: 'PM100主机专用切刀', description_en: 'Cutter for PM100', type: '切刀', image1_url: '/images/shop/ET2002.jpg', image2_url: '/images/shop/ET1003.jpg', explosion_diagram_pdf: '/pdfs/accessories/PM100-CUTTER.pdf', status: 'publish', sort_order: 10 },
//   { id: 10, product_line_id: 2, model: 'PM100-ROLLER', title_zh: 'PM100滚轮', title_en: 'PM100 Roller', description_zh: 'PM100主机滚轮', description_en: 'Roller for PM100', type: '滚轮', image1_url: '/images/shop/ET1003.jpg', image2_url: '/images/shop/LA-E5P.jpg', explosion_diagram_pdf: '/pdfs/accessories/PM100-ROLLER.pdf', status: 'publish', sort_order: 20 },
//   { id: 12, product_line_id: 3, model: 'TM200-BLADE', title_zh: 'TM200刀片', title_en: 'TM200 Blade', description_zh: 'TM200主机专用刀片', description_en: 'Blade for TM200', type: '刀片', image1_url: '/images/shop/FR8003.jpg', image2_url: '/images/shop/EC2005.jpg', explosion_diagram_pdf: '/pdfs/accessories/TM200-BLADE.pdf', status: 'publish', sort_order: 10 },
//   { id: 13, product_line_id: 3, model: 'TM200-SPRING', title_zh: 'TM200弹簧', title_en: 'TM200 Spring', description_zh: 'TM200主机弹簧', description_en: 'Spring for TM200', type: '弹簧', image1_url: '/images/shop/EC2005.jpg', image2_url: '/images/shop/FR8003.jpg', explosion_diagram_pdf: '/pdfs/accessories/TM200-SPRING.pdf', status: 'publish', sort_order: 20 },
//   { id: 14, product_line_id: 4, model: 'ACB100-VALVE', title_zh: 'ACB100气阀', title_en: 'ACB100 Valve', description_zh: 'ACB100主机气阀', description_en: 'Valve for ACB100', type: '气阀', image1_url: '/images/shop/MPV.jpg', image2_url: '/images/shop/LA-E4S.jpg', explosion_diagram_pdf: '/pdfs/accessories/ACB100-VALVE.pdf', status: 'publish', sort_order: 10 },
// ];

// wp_bjt_accessories
// const mockAccessories = [
//   { id: 1, product_line_id: 1, model: 'E4S-FAN', brand: 'BJT', part_number: 'A10001', name_zh: 'E4S风扇组件', name_en: 'E4S Fan Assembly', spec: '12x8x6cm', spec_imperial: '4.7x3.1x2.4in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/LA-E4S.jpg', status: 'publish', unit: 'pcs' },
//   { id: 2, product_line_id: 1, model: 'E4S-FAN', brand: 'BJT', part_number: 'A10002', name_zh: 'E4S风扇组件-美规', name_en: 'E4S Fan Assembly-US', spec: '12x8x6cm', spec_imperial: '4.7x3.1x2.4in', voltage: '110V', frequency: '60Hz', image_url: '/images/shop/LA-E5P.jpg', status: 'publish', unit: 'pcs' },
//   { id: 3, product_line_id: 1, model: 'E4S-CTRL', brand: 'BJT', part_number: 'A20001', name_zh: 'E4S控制板组件', name_en: 'E4S Controller Assembly', spec: '10x8x3cm', spec_imperial: '3.9x3.1x1.2in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/LA-E5P.jpg', status: 'publish', unit: 'pcs' },
//   { id: 4, product_line_id: 1, model: 'E4S-HEATER', brand: 'BJT', part_number: 'A30001', name_zh: 'E4S加热器组件', name_en: 'E4S Heater Assembly', spec: '15x10x8cm', spec_imperial: '5.9x3.9x3.1in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/LA-E4C.jpg', status: 'publish', unit: 'pcs' },
//   { id: 5, product_line_id: 1, model: 'E4S-FAN-CHILD', brand: 'BJT', part_number: 'A40001', name_zh: 'E4S风扇子件组件', name_en: 'E4S Fan Child Assembly', spec: '8x6x3cm', spec_imperial: '3.1x2.4x1.2in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/MPV.jpg', status: 'publish', unit: 'pcs' },
//   { id: 6, product_line_id: 2, model: 'PM100-CUTTER', brand: 'BJT', part_number: 'B10001', name_zh: 'PM100切刀组件', name_en: 'PM100 Cutter Assembly', spec: '20x5x2cm', spec_imperial: '7.9x2.0x0.8in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/ET2002.jpg', status: 'publish', unit: 'pcs' },
//   { id: 7, product_line_id: 2, model: 'PM100-ROLLER', brand: 'BJT', part_number: 'B20001', name_zh: 'PM100滚轮组件', name_en: 'PM100 Roller Assembly', spec: '10x4x4cm', spec_imperial: '3.9x1.6x1.6in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/ET1003.jpg', status: 'publish', unit: 'pcs' },
//   { id: 8, product_line_id: 3, model: 'TM200-BLADE', brand: 'BJT', part_number: 'C10001', name_zh: 'TM200刀片组件', name_en: 'TM200 Blade Assembly', spec: '5x2x0.5cm', spec_imperial: '2.0x0.8x0.2in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/FR8003.jpg', status: 'publish', unit: 'pcs' },
//   { id: 9, product_line_id: 3, model: 'TM200-SPRING', brand: 'BJT', part_number: 'C20001', name_zh: 'TM200弹簧组件', name_en: 'TM200 Spring Assembly', spec: '3x1x1cm', spec_imperial: '1.2x0.4x0.4in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/EC2005.jpg', status: 'publish', unit: 'pcs' },
//   { id: 10, product_line_id: 4, model: 'ACB100-VALVE', brand: 'BJT', part_number: 'D10001', name_zh: 'ACB100气阀组件', name_en: 'ACB100 Valve Assembly', spec: '6x3x3cm', spec_imperial: '2.4x1.2x1.2in', voltage: '220V', frequency: '50Hz', image_url: '/images/shop/MPV.jpg', status: 'publish', unit: 'pcs' },
// ];

// wp_bjt_prices (filtered for accessory target_type)
// const mockAccessoryPrices = [
//   // Prices for accessory ID 1 (Part Number A10001)
//   { id: 9, product_line_id: 1, target_type: 'accessory', target_id: 1, region: 'CN', currency: 'CNY', base_price: 200.00, min_quantity: 1, max_quantity: 10, discount_rate: 0.0500, status: 'active' },
//   { id: 10, product_line_id: 1, target_type: 'accessory', target_id: 1, region: 'US', currency: 'USD', base_price: 32.00, min_quantity: 1, max_quantity: 10, discount_rate: 0.0500, status: 'active' },
//   { id: 11, product_line_id: 1, target_type: 'accessory', target_id: 1, region: 'EU', currency: 'EUR', base_price: 30.00, min_quantity: 1, max_quantity: 10, discount_rate: 0.0500, status: 'active' },
//   { id: 12, product_line_id: 1, target_type: 'accessory', target_id: 1, region: 'AU', currency: 'AUD', base_price: 50.00, min_quantity: 1, max_quantity: 10, discount_rate: 0.0500, status: 'active' },
//   // Prices for accessory ID 5 (Part Number A40001)
//   { id: 13, product_line_id: 1, target_type: 'accessory', target_id: 5, region: 'CN', currency: 'CNY', base_price: 50.00, min_quantity: 1, max_quantity: null, discount_rate: 0.0500, status: 'active' },
// ];

// wp_bjt_inventory (filtered for accessory target_type)
// const mockAccessoryInventory = [
//   // Inventory for accessory ID 1 (Part Number A10001)
//   { id: 3, product_line_id: 1, target_type: 'accessory', target_id: 1, region: 'CN', warehouse: 'WH-SH-01', quantity: 200, reserved: 20, status: 'active' },
//   // Inventory for accessory ID 5 (Part Number A40001)
//   { id: 4, product_line_id: 1, target_type: 'accessory', target_id: 5, region: 'CN', warehouse: 'WH-SH-01', quantity: 150, reserved: 10, status: 'active' },
// ];

// --- Mock Functions ---

// Placeholder functions - Updated to match mockup.sql data

const getMachinePartPrices = (partId: number, productLineId: number): PriceTier[] => {
  console.warn(`Called mock getMachinePartPrices for partId: ${partId}, productLineId: ${productLineId}`);

  // Filter prices for the specific part and product line
  const partPrices = pricesData.filter(
    p => p.target_type === 'host' && 
         p.target_id === partId && 
         p.product_line_id === productLineId && 
         p.status === 'active'
  );

  if (partPrices.length === 0) {
    console.warn(`No mock price data found for partId ${partId}, productLineId ${productLineId}. Returning empty array.`);
    return [];
  }

  // Group prices by region
  const regionPrices: Record<string, any> = {};
  partPrices.forEach(price => {
    if (!regionPrices[price.region]) {
      regionPrices[price.region] = {
        currency: price.currency,
        tiers: []
      };
    }
    regionPrices[price.region].tiers.push({
      min_quantity: price.min_quantity,
      max_quantity: price.max_quantity,
      base_price: price.base_price,
      discount_rate: price.discount_rate
    });
  });

  // Convert to PriceTier format
  const priceTiers: PriceTier[] = Object.keys(regionPrices).map(region => ({
    region: region,
    currency: regionPrices[region].currency,
    tiers: regionPrices[region].tiers.sort((a: any, b: any) => a.min_quantity - b.min_quantity)
  }));

  return priceTiers;
};

const getMachinePartInventory = (partId: number, productLineId: number): InventoryData[] => { 
  console.warn(`Called mock getMachinePartInventory for partId: ${partId}, productLineId: ${productLineId}`);

  // Filter inventory for the specific part and product line
  const partInventory = inventoryData.filter(
    inv => inv.target_type === 'host' && 
           inv.target_id === partId && 
           inv.product_line_id === productLineId && 
           inv.status === 'active'
  );

  if (partInventory.length === 0) {
    console.warn(`No mock inventory data found for partId ${partId}, productLineId ${productLineId}. Returning empty array.`);
    return [];
  }

  // Convert to InventoryData format
  const inventoryList: InventoryData[] = partInventory.map(inv => ({
    region: inv.region,
    warehouse: inv.warehouse,
    quantity: inv.quantity,
    reserved: inv.reserved || 0
  }));

  return inventoryList;
};

const getAccessoryHierarchy = (): MachineAccessory[] => { console.warn('getAccessoryHierarchy mock called'); return []; }; // Placeholder

// New mock functions for Accessory Parts
const getAccessoryPartPrices = (accessoryId: number): PriceTier[] => {
  console.warn(`Called mock getAccessoryPartPrices for accessoryId: ${accessoryId}`);
  const regionPrices: Record<string, { currency: string, tiers: Array<{min_quantity: number, max_quantity: number | null, base_price: number, discount_rate: number | null}> }> = {};

  mockAccessoryPrices
    .filter(p => p.target_id === accessoryId)
    .forEach(p => {
      if (!regionPrices[p.region]) {
        regionPrices[p.region] = { currency: p.currency, tiers: [] };
      }
      const tier: {min_quantity: number, max_quantity: number | null, base_price: number, discount_rate: number | null} = {
        min_quantity: p.min_quantity,
        max_quantity: p.max_quantity,
        base_price: p.base_price,
        discount_rate: p.discount_rate === undefined ? null : p.discount_rate
      };
      regionPrices[p.region].tiers.push(tier);
    });

  const priceTiers: PriceTier[] = Object.keys(regionPrices).map((region: string) => ({
    region: region,
    currency: regionPrices[region].currency,
    tiers: regionPrices[region].tiers.sort((a, b) => a.min_quantity - b.min_quantity)
  }));

  if (priceTiers.length === 0) {
      console.warn(`No mock price data found for accessoryId ${accessoryId}.`);
  }
  return priceTiers;
};

const getAccessoryPartInventory = (accessoryId: number): InventoryData[] => {
  console.warn(`Called mock getAccessoryPartInventory for accessoryId: ${accessoryId}`);
  const inventory: InventoryData[] = mockAccessoryInventory
    .filter(inv => inv.target_id === accessoryId)
    .map(({ region, warehouse, quantity, reserved }) => ({ region, warehouse, quantity, reserved }));

  if (inventory.length === 0) {
      console.warn(`No mock inventory data found for accessoryId ${accessoryId}.`);
  }
  return inventory;
};

// --- Host Machine Parts Mock Data (Based on wp_bjt_parts + wp_bjt_host_models) ---

// Helper data extracted from wp_bjt_host_models for merging
// const hostModelsData = {
//   // Product Line 1
//   'LA-E4S': { title_zh: '气垫机E4S', title_en: 'Air Cushion E4S', description_zh: '高效效率小型气垫机，适合小规模包装工作。', description_en: 'High-efficiency small air cushion machine suitable for small-scale packaging work.', type: '小型', image1_url: '/images/shop/LA-E4S.jpg', image2_url: '/images/shop/LA-E5P.jpg', explosion_diagram_pdf: '/pdfs/models/LA-E4S.pdf' },
//   'LA-E5P': { title_zh: '气垫机E5P', title_en: 'Air Cushion E5P', description_zh: '中等规模气垫机，高速运行。', description_en: 'Medium-scale air cushion machine with high-speed operation.', type: '中型', image1_url: '/images/shop/LA-E5P.jpg', image2_url: '/images/shop/LA-E4C.jpg', explosion_diagram_pdf: '/pdfs/models/LA-E5P.pdf' },
//   'LA-E6L': { title_zh: '气垫机E6L', title_en: 'Air Cushion E6L', description_zh: '大型工业级气垫机，高产能。', description_en: 'Large industrial air cushion machine with high productivity.', type: '大型', image1_url: '/images/shop/LA-E4C.jpg', image2_url: '/images/shop/MPV.jpg', explosion_diagram_pdf: '/pdfs/models/LA-E6L.pdf' },
//   // Product Line 2
//   'PM-100': { title_zh: '纸机100', title_en: 'Paper Machine 100', description_zh: '基础型纸包装机。', description_en: 'Basic paper packaging machine.', type: '基础型', image1_url: '/images/shop/ET2002.jpg', image2_url: '/images/shop/ET1003.jpg', explosion_diagram_pdf: '/pdfs/models/PM-100.pdf' },
//   'PM-200': { title_zh: '纸机200', title_en: 'Paper Machine 200', description_zh: '标准型纸包装机。', description_en: 'Standard paper packaging machine.', type: '标准型', image1_url: '/images/shop/ET1003.jpg', image2_url: '/images/shop/LA-E5P.jpg', explosion_diagram_pdf: '/pdfs/models/PM-200.pdf' },
//   'PM-300': { title_zh: '纸机300', title_en: 'Paper Machine 300', description_zh: '高级型纸包装机。', description_en: 'Advanced paper packaging machine.', type: '高级型', image1_url: '/images/shop/LA-F2.jpg', image2_url: '/images/shop/ET2002.jpg', explosion_diagram_pdf: '/pdfs/models/PM-300.pdf' },
//   // Product Line 3
//   'TM-200': { title_zh: '胶带机200', title_en: 'Tape Machine 200', description_zh: '标准型胶带封箱机。', description_en: 'Standard tape sealing machine.', type: '标准型', image1_url: '/images/shop/FR8003.jpg', image2_url: '/images/shop/EC2005.jpg', explosion_diagram_pdf: '/pdfs/models/TM-200.pdf' },
//   'TM-300': { title_zh: '胶带机300', title_en: 'Tape Machine 300', description_zh: '高速型胶带封箱机。', description_en: 'High-speed tape sealing machine.', type: '高速型', image1_url: '/images/shop/EC2005.jpg', image2_url: '/images/shop/FR8003.jpg', explosion_diagram_pdf: '/pdfs/models/TM-300.pdf' },
//   'TM-400': { title_zh: '胶带机400', title_en: 'Tape Machine 400', description_zh: '全自动胶带封箱机。', description_en: 'Fully automatic tape sealing machine.', type: '自动型', image1_url: '/images/shop/MPV.jpg', image2_url: '/images/shop/LA-E4S.jpg', explosion_diagram_pdf: '/pdfs/models/TM-400.pdf' },
//   // Product Line 4
//   'ACB-100': { title_zh: '气柱袋100', title_en: 'Air Column Bag 100', description_zh: '小型气柱袋机。', description_en: 'Small air column bag machine.', type: '小型', image1_url: '/images/shop/MPV.jpg', image2_url: '/images/shop/LA-E4S.jpg', explosion_diagram_pdf: '/pdfs/models/ACB-100.pdf' },
//   'ACB-200': { title_zh: '气柱袋200', title_en: 'Air Column Bag 200', description_zh: '中型气柱袋机。', description_en: 'Medium air column bag machine.', type: '中型', image1_url: '/images/shop/LA-E4S.jpg', image2_url: '/images/shop/MPV.jpg', explosion_diagram_pdf: '/pdfs/models/ACB-200.pdf' },
//   'ACB-300': { title_zh: '气柱袋300', title_en: 'Air Column Bag 300', description_zh: '大型气柱袋机。', description_en: 'Large air column bag machine.', type: '大型', image1_url: '/images/shop/LA-E5P.jpg', image2_url: '/images/shop/LA-E4C.jpg', explosion_diagram_pdf: '/pdfs/models/ACB-300.pdf' },
// };

export const mockMachineParts: MachinePart[] = rawMachinePartsData.map((staticPart: any) => {
  const modelKey = staticPart.model as keyof typeof hostModelsData;
  const modelDetails = hostModelsData[modelKey] || {};

  return {
    ...(staticPart as Omit<MachinePart, 'prices' | 'inventory' | 'model_title_zh' | 'model_title_en' | 'model_description_zh' | 'model_description_en' | 'model_type' | 'model_image1_url' | 'model_image2_url' | 'model_explosion_diagram_pdf'>),
    model_title_zh: modelDetails.title_zh,
    model_title_en: modelDetails.title_en,
    model_description_zh: modelDetails.description_zh,
    model_description_en: modelDetails.description_en,
    model_type: modelDetails.type,
    model_image1_url: modelDetails.image1_url,
    model_image2_url: modelDetails.image2_url,
    model_explosion_diagram_pdf: modelDetails.explosion_diagram_pdf,
    prices: getMachinePartPrices(staticPart.id, staticPart.product_line_id),
    inventory: getMachinePartInventory(staticPart.id, staticPart.product_line_id),
  } as MachinePart;
});

/**
 * MOCK: Get Machine Parts with filtering and pagination
 */
export const getMockMachineParts = (
  filters: { 
    voltage?: string;
    product_line_id?: number;
  } = {},
  page: number = 1, 
  pageSize: number = 10
): MachinePartListData => {
  let filteredParts = [...mockMachineParts];

  // Apply voltage filter if provided
  if (filters.voltage) {
    filteredParts = filteredParts.filter(part => part.voltage === filters.voltage);
  }

  // Apply product_line_id filter if provided
  if (filters.product_line_id !== undefined) {
    console.log(`[Mock] Filtering by product_line_id: ${filters.product_line_id}`);
    filteredParts = filteredParts.filter(part => part.product_line_id === filters.product_line_id);
  }

  // Apply pagination
  const total = filteredParts.length;
  console.log(`[Mock] Total parts after filtering: ${total}`);
  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const items = filteredParts.slice(startIndex, endIndex);

  return {
    items,
    total,
    page,
    page_size: pageSize,
    total_pages: totalPages
  };
};

// --- Function to get Mock Accessories ---
export const getMockMachineAccessories = (parentPartNumber: string): MachineAccessory[] => {
  console.log(`getMockMachineAccessories called for parent: ${parentPartNumber}`);
  const childRelations = mockRelations.filter(r => r.parent_part_number === parentPartNumber);
  
  console.log(`Found child relations:`, childRelations);

  const accessoriesByModel: Record<string, MachineAccessory> = {};

  childRelations.forEach(relation => {
    const accessoryPartData = mockAccessories.find(acc => acc.part_number === relation.child_part_number);
    if (!accessoryPartData) {
      console.warn(`Accessory part data not found for part number: ${relation.child_part_number}`);
      return;
    }

    const accessoryModelData = mockAccessoryModels.find(mod => mod.model === accessoryPartData.model && mod.product_line_id === accessoryPartData.product_line_id);
    if (!accessoryModelData) {
      console.warn(`Accessory model data not found for model: ${accessoryPartData.model}`);
      return;
    }

    // Create the AccessoryPart structure
    const formattedPart: AccessoryPart = {
      id: accessoryPartData.id.toString(),
      part_number: accessoryPartData.part_number,
      title: accessoryPartData.name_en, // Adjust based on locale if needed
      spec: accessoryPartData.spec || '',
      spec_imperial: accessoryPartData.spec_imperial || '',
      specs: { // Construct specs object from available data
        ...(accessoryPartData.spec && { spec_metric: accessoryPartData.spec }),
        ...(accessoryPartData.spec_imperial && { spec_imperial: accessoryPartData.spec_imperial }),
        ...(accessoryPartData.voltage && { voltage: accessoryPartData.voltage }),
        ...(accessoryPartData.frequency && { frequency: accessoryPartData.frequency }),
      },
      // Note: The structure for prices/inventory in AccessoryPart might differ from PriceTier[]/InventoryData[]
      // Adjusting based on AccessoryPart definition in types/machines.ts which seems to expect simple objects
      // This part needs verification against the exact AccessoryPart type definition if it was updated
      prices: (() => { // Simplified mock price structure for AccessoryPart
          const prices = getAccessoryPartPrices(accessoryPartData.id);
          const basePrice = prices[0]?.tiers[0]?.base_price ?? 0;
          // Assuming tier1 is 5+, tier2 is 10+ for simplicity in mock
          const tier1Price = prices[0]?.tiers.find(t => t.min_quantity >= 5)?.base_price ?? basePrice * 0.95;
          const tier2Price = prices[0]?.tiers.find(t => t.min_quantity >= 10)?.base_price ?? basePrice * 0.90;
          return {
              base: basePrice,
              tier1: tier1Price, 
              tier2: tier2Price,
              vip: basePrice * 0.85 // Placeholder VIP price
          };
      })(),
      inventory: (() => { // Simplified mock inventory structure for AccessoryPart
          const inventory = getAccessoryPartInventory(accessoryPartData.id);
          // Example: Summing quantity across all regions/warehouses for simplicity
          const totalQuantity = inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
          // Returning a simple structure; adjust if AccessoryPart expects detailed array
          return inventory.length > 0 ? [{ region: inventory[0].region, amount: totalQuantity }] : [];
      })()
    };

    // Group under the MachineAccessory (model)
    if (!accessoriesByModel[accessoryModelData.model]) {
      accessoriesByModel[accessoryModelData.model] = {
        id: accessoryModelData.id.toString(),
        model: accessoryModelData.model,
        title: accessoryModelData.title_en, // Adjust based on locale
        level: relation.level,
        image_url: accessoryModelData.image1_url || '/images/placeholder.jpg',
        parts: [],
        parent_id: parentPartNumber,
      };
    }
    accessoriesByModel[accessoryModelData.model].parts.push(formattedPart);
  });
  
  const result = Object.values(accessoriesByModel).sort((a, b) => a.level - b.level); // Sort by level just in case
  console.log(`Returning accessories for ${parentPartNumber}:`, result);
  return result;
};

// Remove placeholder getAccessoryHierarchy if present

// --- Spare Parts Mock Data (Placeholder) ---
export const mockSpareParts: any[] = [];

// --- Default Export --- 
export default {
  getMockMachineParts,
  // mockAccessoriesHierarchy, // Remove old export if it existed
  getMockMachineAccessories, // Export the new function
  mockSpareParts
}; 