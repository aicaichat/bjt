import { PriceTier } from '../../types/common'; // Import from common types
import pricesData from './data/prices.data.json'; // Import JSON data

export interface PriceRecord {
  id: number;
  product_line_id: number;
  target_type: 'host' | 'accessory' | 'consumable' | 'spare_part';
  target_id: number;
  region: string;
  currency: string;
  base_price: number;
  min_quantity: number;
  max_quantity: number | null;
  discount_rate: number | null;
  status: string;
}

// Assign imported data to the mockPrices constant with type assertion
export const mockPrices: PriceRecord[] = pricesData as PriceRecord[];

/**
 * Converts raw price records into the PriceTier structure for a specific product.
 */
const convertToPriceTiers = (records: PriceRecord[]): PriceTier[] => {
  const priceMap: { [region: string]: { currency: string; tiers: Array<{ min_quantity: number; max_quantity: number | null; base_price: number; discount_rate: number | null; }> } } = {};

  records.forEach(record => {
    if (!priceMap[record.region]) {
      priceMap[record.region] = {
        currency: record.currency,
        tiers: []
      };
    }
    priceMap[record.region].tiers.push({
      min_quantity: record.min_quantity,
      max_quantity: record.max_quantity,
      base_price: record.base_price, // Keep original base_price here for PriceTier
      discount_rate: record.discount_rate,
    });
  });

  // Sort tiers by min_quantity
  Object.values(priceMap).forEach(regionData => {
    regionData.tiers.sort((a, b) => a.min_quantity - b.min_quantity);
  });

  return Object.entries(priceMap).map(([region, data]) => ({
    region,
    currency: data.currency,
    tiers: data.tiers // The tiers still contain base_price as per PriceTier definition
  }));
};

// --- Helper functions to get prices for different product types ---

export const getHostPrices = (hostId: number | string, productLineId: number): PriceTier[] => {
    const productPrices = mockPrices.filter(
        p => p.product_line_id === productLineId && p.target_type === 'host' && p.target_id === hostId && p.status === 'active'
    );
    return convertToPriceTiers(productPrices);
};

export const getMachinePrices = getHostPrices; // Alias for consistency

export const getAccessoryPartPrices = (accessoryPartId: number | string, productLineId: number): PriceTier[] => {
    const productPrices = mockPrices.filter(
        p => p.product_line_id === productLineId && p.target_type === 'accessory' && p.target_id === accessoryPartId && p.status === 'active'
    );
    return convertToPriceTiers(productPrices);
};

export const getConsumablePrices = (consumableId: number | string, productLineId: number): PriceTier[] => {
    const productPrices = mockPrices.filter(
        p => p.product_line_id === productLineId && p.target_type === 'consumable' && p.target_id === consumableId && p.status === 'active'
    );
    return convertToPriceTiers(productPrices);
};

export const getSparePartPrices = (sparePartId: number | string, productLineId: number): PriceTier[] => {
    const productPrices = mockPrices.filter(
        p => p.product_line_id === productLineId && p.target_type === 'spare_part' && p.target_id === sparePartId && p.status === 'active'
    );
    return convertToPriceTiers(productPrices);
}; 