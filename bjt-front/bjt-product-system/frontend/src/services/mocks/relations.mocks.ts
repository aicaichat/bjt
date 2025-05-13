import { MachineAccessory, AccessoryPart } from '../types/machines';
// We will need AccessoryPart type later, and potentially SparePart types
// import { AccessoryPart } from '../types/machines'; 
// import { getAccessoryPartById } from './accessories.mocks'; // Assuming this will exist
// import { getSparePartByPartNumber } from './spareParts.mocks'; // Assuming this will exist
// Assuming these helpers exist and work correctly
import { 
    getAccessoryModelRecordByModel, 
    getAccessoryPartsByModel, 
    getAccessoryPartRecordByPartNumber 
} from './accessories.mocks'; 


interface RelationRecord {
  id: number;
  product_line_id: number;
  parent_part_number: string;
  child_part_number: string;
  child_type: 'accessory' | 'spare_part';
  level: number;
  quantity: number | null;
  required_parts: string | null;
  required_quantity: number | null;
  sort_order: number | null;
  status: string;
}

// Mock data based on wp_bjt_relations table
const mockRelations: RelationRecord[] = [
  { id: 1, product_line_id: 1, parent_part_number: '13A00001', child_part_number: 'A10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
  { id: 2, product_line_id: 1, parent_part_number: 'A10001', child_part_number: 'A40001', child_type: 'accessory', level: 2, quantity: 1, required_parts: null, required_quantity: null, sort_order: 20, status: 'publish' },
  { id: 3, product_line_id: 1, parent_part_number: 'A40001', child_part_number: 'A40002', child_type: 'accessory', level: 3, quantity: 1, required_parts: null, required_quantity: null, sort_order: 30, status: 'publish' }, // Assuming A40002 is accessory part number
  { id: 4, product_line_id: 1, parent_part_number: 'A40002', child_part_number: 'A40003', child_type: 'accessory', level: 4, quantity: 1, required_parts: null, required_quantity: null, sort_order: 40, status: 'publish' }, // Assuming A40003 is accessory part number
  { id: 5, product_line_id: 1, parent_part_number: 'A40003', child_part_number: '16P00001', child_type: 'spare_part', level: 5, quantity: 1, required_parts: '16P00002', required_quantity: 1, sort_order: 50, status: 'publish' },
  { id: 6, product_line_id: 1, parent_part_number: '13A00001', child_part_number: '16P00002', child_type: 'spare_part', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 60, status: 'publish' },
  { id: 7, product_line_id: 2, parent_part_number: '23P00001', child_part_number: 'B10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
  { id: 8, product_line_id: 2, parent_part_number: 'B10001', child_part_number: 'B10002', child_type: 'accessory', level: 2, quantity: 1, required_parts: null, required_quantity: null, sort_order: 20, status: 'publish' }, // Assuming B10002 is accessory part number
  { id: 9, product_line_id: 2, parent_part_number: 'B10002', child_part_number: 'B10003', child_type: 'accessory', level: 3, quantity: 1, required_parts: null, required_quantity: null, sort_order: 30, status: 'publish' }, // Assuming B10003 is accessory part number
  { id: 10, product_line_id: 2, parent_part_number: 'B10003', child_part_number: 'B10004', child_type: 'accessory', level: 4, quantity: 1, required_parts: null, required_quantity: null, sort_order: 40, status: 'publish' }, // Assuming B10004 is accessory part number
  { id: 11, product_line_id: 2, parent_part_number: 'B10004', child_part_number: '26P00001', child_type: 'spare_part', level: 5, quantity: 1, required_parts: null, required_quantity: null, sort_order: 50, status: 'publish' },
  { id: 12, product_line_id: 2, parent_part_number: '23P00001', child_part_number: '26P00002', child_type: 'spare_part', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 60, status: 'publish' },
  { id: 13, product_line_id: 3, parent_part_number: '33T00001', child_part_number: 'C10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
  { id: 14, product_line_id: 3, parent_part_number: 'C10001', child_part_number: 'C10002', child_type: 'accessory', level: 2, quantity: 1, required_parts: null, required_quantity: null, sort_order: 20, status: 'publish' }, // Assuming C10002 is accessory part number
  { id: 15, product_line_id: 3, parent_part_number: 'C10002', child_part_number: 'C10003', child_type: 'accessory', level: 3, quantity: 1, required_parts: null, required_quantity: null, sort_order: 30, status: 'publish' }, // Assuming C10003 is accessory part number
  { id: 16, product_line_id: 3, parent_part_number: 'C10003', child_part_number: 'C10004', child_type: 'accessory', level: 4, quantity: 1, required_parts: null, required_quantity: null, sort_order: 40, status: 'publish' }, // Assuming C10004 is accessory part number
  { id: 17, product_line_id: 3, parent_part_number: 'C10004', child_part_number: '36P00001', child_type: 'spare_part', level: 5, quantity: 1, required_parts: null, required_quantity: null, sort_order: 50, status: 'publish' },
  { id: 18, product_line_id: 3, parent_part_number: '33T00001', child_part_number: '36P00002', child_type: 'spare_part', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 60, status: 'publish' },
  { id: 19, product_line_id: 4, parent_part_number: '43B00001', child_part_number: 'D10001', child_type: 'accessory', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 10, status: 'publish' },
  { id: 20, product_line_id: 4, parent_part_number: 'D10001', child_part_number: 'D10002', child_type: 'accessory', level: 2, quantity: 1, required_parts: null, required_quantity: null, sort_order: 20, status: 'publish' }, // Assuming D10002 is accessory part number
  { id: 21, product_line_id: 4, parent_part_number: 'D10002', child_part_number: 'D10003', child_type: 'accessory', level: 3, quantity: 1, required_parts: null, required_quantity: null, sort_order: 30, status: 'publish' }, // Assuming D10003 is accessory part number
  { id: 22, product_line_id: 4, parent_part_number: 'D10003', child_part_number: 'D10004', child_type: 'accessory', level: 4, quantity: 1, required_parts: null, required_quantity: null, sort_order: 40, status: 'publish' }, // Assuming D10004 is accessory part number
  { id: 23, product_line_id: 4, parent_part_number: 'D10004', child_part_number: '46B00001', child_type: 'spare_part', level: 5, quantity: 1, required_parts: null, required_quantity: null, sort_order: 50, status: 'publish' },
  { id: 24, product_line_id: 4, parent_part_number: '43B00001', child_part_number: '46B00002', child_type: 'spare_part', level: 1, quantity: 1, required_parts: null, required_quantity: null, sort_order: 60, status: 'publish' },
];


// Recursive function to build the hierarchy for a given parent part number
const buildHierarchy = (parentPartNumber: string, currentLevel: number, maxLevel: number = 5): MachineAccessory[] => {
    if (currentLevel > maxLevel) {
        return []; // Stop recursion if max level is exceeded
    }

    const children: MachineAccessory[] = [];
    const childRelations = mockRelations.filter(r => r.parent_part_number === parentPartNumber && r.status === 'publish');

    for (const relation of childRelations) {
        if (relation.child_type === 'accessory') {
            const partRecord = getAccessoryPartRecordByPartNumber(relation.child_part_number);
            if (!partRecord) {
                console.warn(`Accessory part record not found for part number: ${relation.child_part_number}`);
                continue;
            }

            const modelRecord = getAccessoryModelRecordByModel(partRecord.model);
            if (!modelRecord) {
                console.warn(`Accessory model record not found for model: ${partRecord.model} (part: ${partRecord.part_number})`);
                continue;
            }
            
            // Fetch all parts associated with this model (could be more than just the child_part_number)
            const partsForModel = getAccessoryPartsByModel(modelRecord.model);
            if (!partsForModel || partsForModel.length === 0) {
                 console.warn(`No parts found for accessory model: ${modelRecord.model}`);
                 // Decide if we should continue without parts or skip this accessory
                 // continue; 
            }

            // Recursively find children for the current child part number
            const grandChildren = buildHierarchy(relation.child_part_number, currentLevel + 1, maxLevel);

            const accessory: MachineAccessory = {
                id: modelRecord.id, // Using model ID as the primary ID for the accessory node
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
                parts: partsForModel, // Assign all parts belonging to this model
                children: grandChildren.length > 0 ? grandChildren : undefined, // Assign children if any exist
                // --- TODO: Handle required_parts/required_quantity from relation if needed ---
                // This might require adding properties to MachineAccessory type
            };
            children.push(accessory);

        } else if (relation.child_type === 'spare_part') {
             // --- TODO: Handle spare parts --- 
             // How should spare parts attached directly in the hierarchy be represented?
             // Maybe add a 'spareParts: SparePart[]' property to MachineAccessory?
             // const sparePart = getSparePartByPartNumber(relation.child_part_number);
             // if (sparePart) { ... add to parent accessory ... }
             console.warn(`Spare part relation found (${relation.child_part_number}) under ${parentPartNumber}. Handling not implemented.`);
        }
    }

    // Sort children based on sort_order
    children.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    return children;
};

/**
 * Main function to get the accessory hierarchy, typically starting from a host machine part number.
 */
export const getAccessoryHierarchy = (hostPartNumber?: string): MachineAccessory[] => {
  if (!hostPartNumber) {
     console.warn("getAccessoryHierarchy called without hostPartNumber. Returning empty array.");
     // Or potentially find all level 1 accessories across all hosts?
     return [];
  }
  // Start building hierarchy from level 1 for the given host part number
  return buildHierarchy(hostPartNumber, 1);
};

// --- Helper functions (to be implemented or imported) ---

// function getAccessoryModelByPartNumber(partNumber: string): AccessoryModel | undefined { ... }
// function getAccessoryPartByPartNumber(partNumber: string): AccessoryPart | undefined { ... }
// function getSparePartByPartNumber(partNumber: string): SparePart | undefined { ... } 