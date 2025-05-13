import { InventoryData } from '../../types/common'; // Import from common types
import inventoryData from './data/inventory.data.json'; // Import JSON data

export interface InventoryRecord {
  id: number;
  product_line_id: number;
  target_type: 'host' | 'accessory' | 'consumable' | 'spare_part';
  target_id: number;
  region: string;
  warehouse: string;
  quantity: number;
  reserved: number;
  status: string;
}

// Assign imported data to the mockInventory constant with type assertion
export const mockInventory: InventoryRecord[] = inventoryData as InventoryRecord[];

/**
 * Converts raw inventory records into the InventoryData structure for a specific product.
 */
const convertToInventoryData = (records: InventoryRecord[]): InventoryData[] => {
    return records.map(record => ({
        region: record.region,
        warehouse: record.warehouse,
        quantity: record.quantity,
        reserved: record.reserved
    }));
};

// Helper function to get inventory for a specific product type and ID
const getInventoryForProduct = (targetType: 'host' | 'accessory' | 'consumable' | 'spare_part', targetId: number | string, productLineId: number): InventoryData[] => {
    const productInventory = mockInventory.filter(
        inv => inv.product_line_id === productLineId && 
               inv.target_type === targetType && 
               inv.target_id === targetId && 
               inv.status === 'active'
    );
    return convertToInventoryData(productInventory);
};

// --- Specific helper functions for each product type ---

export const getHostInventory = (hostId: number | string, productLineId: number): InventoryData[] => {
    // Inventory is linked to wp_bjt_host_models.id
    return getInventoryForProduct('host', hostId, productLineId);
};

export const getMachineInventory = getHostInventory; // Alias

export const getAccessoryPartInventory = (accessoryPartId: number | string, productLineId: number): InventoryData[] => {
    // Inventory is linked to wp_bjt_accessories.id (the part)
    return getInventoryForProduct('accessory', accessoryPartId, productLineId);
};

export const getConsumableInventory = (consumableId: number | string, productLineId: number): InventoryData[] => {
    // Inventory is linked to wp_bjt_consumables.id
    return getInventoryForProduct('consumable', consumableId, productLineId);
};

export const getSparePartInventory = (sparePartId: number | string, productLineId: number): InventoryData[] => {
    // Inventory is linked to wp_bjt_spare_parts.id
    return getInventoryForProduct('spare_part', sparePartId, productLineId);
}; 