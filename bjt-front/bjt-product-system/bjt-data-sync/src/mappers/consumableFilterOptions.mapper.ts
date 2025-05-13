import { Pool, RowDataPacket } from 'mysql2/promise';
import { logger } from '../common/logger';

// Define interfaces for the raw DB results for clarity
interface DbShape extends RowDataPacket {
  code: string;
  name_en: string;
  name_zh: string;
  image_url: string | null;
}

interface DbMaterial extends RowDataPacket {
  code: string;
  name_en: string;
  name_zh: string;
}

interface DbHostModel extends RowDataPacket {
  model: string;
  name_en: string;
  name_zh: string; // In DB it's model_name, aliased in query
  explosion_diagram_pdf: string | null;
}

interface DbSpecification extends RowDataPacket {
  metric_value: string; // Read as string from DB then parsed
  metric_unit: string;
}

// Define interfaces for the final option structures
export interface FilterOption {
  id: string;
  name: string;
  image_url?: string; // For shapes
}

export interface ModelFilterOption extends FilterOption {
  // exploded_view_url is not part of the models array directly, but used to build modelExplodedViews
}

export interface ConsumableFilterOptions {
  shapes: FilterOption[];
  materials: FilterOption[];
  models: ModelFilterOption[]; // This will be FilterOption[] in the final structure
  thicknesses: FilterOption[];
  weights: FilterOption[];
  widths: FilterOption[];
  lengths: FilterOption[];
  modelExplodedViews: { [key: string]: string | null };
}

const PRODUCT_LINE_ID_CONSUMABLES = 1; 

async function fetchShapes(pool: Pool, lang: 'en' | 'zh'): Promise<FilterOption[]> {
  const query = `
    SELECT code, name_en, name_zh, image_url 
    FROM wp_bjt_shapes 
    WHERE product_line_id = ? AND status = 'publish' 
    ORDER BY sort_order, name_en;
  `;
  try {
    const [rows] = await pool.execute<DbShape[]>(query, [PRODUCT_LINE_ID_CONSUMABLES]);
    return rows.map(row => ({
      id: row.code,
      name: lang === 'zh' ? row.name_zh : row.name_en,
      image_url: row.image_url || undefined, 
    }));
  } catch (error) {
    logger.error('Failed to fetch shapes for filter options:', error);
    throw error;
  }
}

async function fetchMaterials(pool: Pool, lang: 'en' | 'zh'): Promise<FilterOption[]> {
  const query = `
    SELECT code, name_en, name_zh 
    FROM wp_bjt_materials 
    WHERE product_line_id = ? AND status = 'publish' 
    ORDER BY sort_order, name_en;
  `;
  try {
    const [rows] = await pool.execute<DbMaterial[]>(query, [PRODUCT_LINE_ID_CONSUMABLES]);
    return rows.map(row => ({
      id: row.code,
      name: lang === 'zh' ? row.name_zh : row.name_en,
    }));
  } catch (error) {
    logger.error('Failed to fetch materials for filter options:', error);
    throw error;
  }
}

interface RawHostModelForOption extends DbHostModel {}

async function fetchHostModelsForOptions(pool: Pool, lang: 'en' | 'zh'): Promise<RawHostModelForOption[]> {
  const query = `
    SELECT DISTINCT hm.model, hm.title_en, hm.title_zh AS name_zh, hm.explosion_diagram_pdf, hm.sort_order
    FROM wp_bjt_host_models hm
    JOIN wp_bjt_consumable_compatibility cc ON hm.model = cc.host_model AND hm.product_line_id = cc.product_line_id
    WHERE hm.product_line_id = ? AND hm.status = 'publish'
    ORDER BY hm.sort_order, hm.title_en;
  `;
  try {
    const [rows] = await pool.execute<RawHostModelForOption[]>(query, [PRODUCT_LINE_ID_CONSUMABLES]);
    return rows;
  } catch (error) {
    logger.error('Failed to fetch host models for filter options:', error);
    throw error;
  }
}

async function fetchSpecifications(pool: Pool, specType: 'thickness' | 'weight' | 'width' | 'length'): Promise<FilterOption[]> {
  const query = `
    SELECT DISTINCT metric_value, metric_unit 
    FROM wp_bjt_specifications 
    WHERE product_line_id = ? AND spec_type = ? AND status = 'publish' 
    ORDER BY CAST(metric_value AS DECIMAL(10,2));
  `;
  try {
    const [rows] = await pool.execute<DbSpecification[]>(query, [PRODUCT_LINE_ID_CONSUMABLES, specType]);
    const specOptions = rows.map(row => {
      const valueStr = parseFloat(row.metric_value).toFixed(2);
      const id = (`${valueStr}${row.metric_unit}`).replace(/\s+/g, '').replace(/\.00(?![0-9])/,'');
      const name = `${valueStr} ${row.metric_unit}`.replace(/\.00(?![0-9])/,'');
      return { id, name };
    });
    return [{ id: 'all', name: 'ALL' }, ...specOptions];
  } catch (error) {
    logger.error(`Failed to fetch ${specType} specifications for filter options:`, error);
    throw error;
  }
}

export async function generateConsumableFilterOptions(pool: Pool, lang: 'en' | 'zh' = 'en'): Promise<ConsumableFilterOptions> {
  logger.info(`Generating consumable filter options for product line ${PRODUCT_LINE_ID_CONSUMABLES} in ${lang}...`);
  try {
    const [shapes, materials, rawHostModels, thicknesses, widths, lengths, weights] = await Promise.all([
      fetchShapes(pool, lang),
      fetchMaterials(pool, lang),
      fetchHostModelsForOptions(pool, lang),
      fetchSpecifications(pool, 'thickness'),
      fetchSpecifications(pool, 'width'),
      fetchSpecifications(pool, 'length'),
      fetchSpecifications(pool, 'weight'),
    ]);

    const modelOptions: ModelFilterOption[] = [
        { id: 'all', name: 'ALL' }, 
        ...rawHostModels.map(model => ({
            id: model.model,
            name: lang === 'zh' ? model.name_zh : model.name_en,
        }))
    ];
    
    const modelExplodedViews: { [key: string]: string | null } = {};
    rawHostModels.forEach(model => {
      if (model.model && model.explosion_diagram_pdf) {
        modelExplodedViews[model.model] = model.explosion_diagram_pdf;
      }
    });
    // Ensure 'all' has an entry, even if null, if frontend expects it.
    // The frontend currently has a default for 'all' in its static options.
    // modelExplodedViews['all'] = modelExplodedViews['all'] || '/images/models/exploded-view-default.svg'; // Or null


    return {
      shapes,
      materials,
      models: modelOptions,
      thicknesses,
      weights,
      widths,
      lengths,
      modelExplodedViews,
    };
  } catch (error) {
    logger.error('Failed to generate consumable filter options structure:', error);
    throw error;
  }
}

export function getConsumableFilterOptionsFileContent(options: ConsumableFilterOptions): string {
  const optionsString = JSON.stringify(options, null, 2)
    .replace(/"image_url": null/g, '"image_url": undefined')
    .replace(/"exploded_view_url": null/g, '"exploded_view_url": undefined');

  return `// Generated by bjt-data-sync script
// Do not edit manually

// These interfaces should ideally align with frontend's expectations or be imported if shared.
export interface FilterOption {
  id: string;
  name: string;
  image_url?: string;
}

export interface ModelFilterOption extends FilterOption {
  // This type is for the 'models' array which does not directly contain exploded_view_url.
  // modelExplodedViews map holds those URLs separately.
}

export interface ConsumableFilterOptions {
  shapes: FilterOption[];
  materials: FilterOption[];
  models: ModelFilterOption[];
  thicknesses: FilterOption[];
  weights: FilterOption[];
  widths: FilterOption[];
  lengths: FilterOption[];
  modelExplodedViews: { [key: string]: string | null };
}

export const dynamicConsumableOptions: ConsumableFilterOptions = ${optionsString};
`;
} 