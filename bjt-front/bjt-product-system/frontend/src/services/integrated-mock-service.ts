/**
 * 集成Mock服务
 * 将SQL数据生成器与现有API服务结合，为各页面提供基于真实数据库结构的Mock数据
 */

import { sqlMockGenerator, getTableData, filterData, getPaginatedData } from './sql-mock-generator';
import { UnifiedMockManagerV2, MockDataType } from './unified-mock-manager-v2';
import { realApiService } from './real-api-service';
import type { 
  MachineListData, 
  AccessoryListData, 
  ConsumableListData, 
  SparePartListData 
} from '../types/api.types';

export interface MockServiceConfig {
  useRealSQLData: boolean;
  useRealAPI?: boolean;
  apiBaseUrl?: string;
  mockEnvironment: 'development' | 'testing' | 'production';
  enableCaching: boolean;
  networkDelay: boolean;
}

/**
 * 集成Mock服务类
 */
export class IntegratedMockService {
  private static instance: IntegratedMockService;
  private config: MockServiceConfig;
  private mockManager: UnifiedMockManagerV2;

  private constructor() {
    this.config = {
      useRealSQLData: true,
      useRealAPI: false,
      apiBaseUrl: 'mock://internal',
      mockEnvironment: 'development',
      enableCaching: true,
      networkDelay: false
    };
    this.mockManager = UnifiedMockManagerV2.getInstance();
    console.log('🔧 集成Mock服务已初始化');
  }

  public static getInstance(): IntegratedMockService {
    if (!IntegratedMockService.instance) {
      IntegratedMockService.instance = new IntegratedMockService();
    }
    return IntegratedMockService.instance;
  }

  /**
   * 设置配置
   */
  public setConfig(config: Partial<MockServiceConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('📝 Mock服务配置已更新:', config);
  }

  /**
   * 获取配置
   */
  public getConfig(): MockServiceConfig {
    return { ...this.config };
  }

  /**
   * 获取产品线数据
   */
  public async getProductLines(): Promise<any[]> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取产品线数据');
        return await realApiService.getProductLines();
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      const data = getTableData('wp_bjt_product_lines');
      console.log('📦 获取产品线数据 (SQL):', data.length);
      return data;
    }
    
    // 回退到原有Mock数据
    return await this.mockManager.getMockData(MockDataType.PRODUCT_LINES);
  }

  /**
   * 获取主机列表数据
   */
  public async getMachines(params?: {
    category?: number;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<MachineListData> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取主机数据');
        return await realApiService.getMachines(params);
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      let conditions: Record<string, any> = {};
      
      // 根据category筛选
      if (params?.category) {
        conditions.product_line_id = params.category;
      }

      // 获取主机料号数据，严格使用数据库字段
      const partsData = filterData('wp_bjt_parts', conditions);
      
      // 转换为MachineProduct格式，确保字段匹配
      const machines: any[] = partsData.map(part => ({
        // 必需的MachineProduct字段
        id: part.id,
        code: part.part_number, // 使用part_number作为code
        title_zh: part.name_zh, // 使用name作为title
        title_en: part.name_en,
        description_zh: part.spec || '', // 使用spec作为description
        description_en: part.spec_imperial || part.spec || '',
        product_line_id: part.product_line_id,
        type: 'machine', // 设置默认类型
        image_url: part.image_url,
        image2_url: null,
        explosion_diagram_pdf: null,
        status: part.status,
        sort_order: 0, // 设置默认排序
        created_at: part.created_at,
        updated_at: part.updated_at,
        
        // 额外的数据库字段（保持完整性）
        part_number: part.part_number,
        name_zh: part.name_zh,
        name_en: part.name_en,
        model: part.model,
        voltage: part.voltage,
        brand: part.brand,
        spec: part.spec,
        spec_imperial: part.spec_imperial,
        package_size_cm: part.package_size_cm,
        package_size_inch: part.package_size_inch,
        net_weight_kg: part.net_weight_kg,
        net_weight_lbs: part.net_weight_lbs,
        gross_weight_kg: part.gross_weight_kg,
        gross_weight_lbs: part.gross_weight_lbs,
        pcs_per_box: part.pcs_per_box,
        pallet_size_cm: part.pallet_size_cm,
        pallet_size_inch: part.pallet_size_inch,
        pcs_per_pallet: part.pcs_per_pallet,
        pallet_height_cm: part.pallet_height_cm,
        pallet_height_inch: part.pallet_height_inch,
        pallet_gross_weight_kg: part.pallet_gross_weight_kg,
        pallet_gross_weight_lbs: part.pallet_gross_weight_lbs,
        unit: part.unit,
        
        // 模拟价格和库存信息
        price: this.generateMockPrice(),
        inventory: this.generateMockInventory()
      }));

      // 搜索过滤
      let filteredMachines = machines;
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredMachines = machines.filter(machine => 
          machine.name_zh.toLowerCase().includes(searchTerm) ||
          machine.name_en.toLowerCase().includes(searchTerm) ||
          machine.part_number.toLowerCase().includes(searchTerm)
        );
      }

      // 分页处理
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = filteredMachines.slice(startIndex, endIndex);

      return {
        items: paginatedItems,
        total: filteredMachines.length,
        page,
        per_page: pageSize,
        total_pages: Math.ceil(filteredMachines.length / pageSize)
      };
    } else {
      // 使用旧的Mock管理器
      return await this.mockManager.getMockData(MockDataType.MACHINES, params);
    }
  }

  /**
   * 获取配件列表数据
   */
  public async getAccessories(params?: {
    machineId?: string;
    category?: number;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<AccessoryListData> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取配件数据');
        return await realApiService.getAccessories(params);
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      let conditions: Record<string, any> = {};
      
      if (params?.category) {
        conditions.product_line_id = params.category;
      }

      const accessoryData = filterData('wp_bjt_accessories', conditions);
      
      // 转换为前端需要的格式
      const items = accessoryData.map(item => ({
        id: item.id,
        product_line_id: item.product_line_id,
        model: item.model || '',
        brand: item.brand || '',
        part_number: item.part_number,
        name: item.name_zh,
        spec: item.spec || '',
        spec_imperial: item.spec_imperial || '',
        voltage: item.voltage,
        frequency: item.frequency,
        unit: item.unit,
        image_url: item.image_url || '',
        status: 'publish' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // 可选的价格和库存信息
        pricing: [{
          base_price: this.generateMockPrice(),
          discount_rate: 0,
          currency: 'USD'
        }],
        inventory: [{
          region: 'default',
          warehouse: 'main',
          quantity: this.generateMockInventory(),
          reserved: 0,
          available: this.generateMockInventory(),
          status: 'in_stock' as const
        }]
      }));

      // 搜索过滤
      let filteredItems = items;
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredItems = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm) ||
          item.part_number.toLowerCase().includes(searchTerm)
        );
      }

      // 分页处理
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);

      console.log(`🔧 获取配件数据 (SQL): ${paginatedItems.length}/${filteredItems.length}`);

      return {
        items: paginatedItems,
        total: filteredItems.length,
        total_pages: Math.ceil(filteredItems.length / pageSize),
        page: page,
        page_size: pageSize
      };
    } else {
      // 使用旧的Mock管理器
      return await this.mockManager.getMockData(MockDataType.ACCESSORIES, params);
    }
  }

  /**
   * 获取耗材列表数据
   */
  public async getConsumables(params?: {
    category?: number;
    shape?: string;
    material?: string;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<ConsumableListData> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取耗材数据');
        return await realApiService.getConsumables(params);
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      let conditions: Record<string, any> = {};
      
      if (params?.category) {
        conditions.product_line_id = params.category;
      }

      if (params?.shape && params.shape !== 'all') {
        conditions.shape_code = params.shape;
      }

      if (params?.material && params.material !== 'all') {
        conditions.material_code = params.material;
      }

      let filteredData = filterData('wp_bjt_accessories', conditions);

      // 搜索过滤
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredData = filteredData.filter(item => 
          (item.name_zh && item.name_zh.toLowerCase().includes(searchTerm)) ||
          (item.name_en && item.name_en.toLowerCase().includes(searchTerm)) ||
          item.part_number.toLowerCase().includes(searchTerm)
        );
      }

      // 转换为前端格式
      const items = filteredData.map(item => ({
        id: item.id,
        product_line_id: item.product_line_id || 1,
        code: item.part_number,
        name: item.name_zh || item.name_en,
        brand: item.brand || 'BJT',
        specs: {
          material: item.material_code || 'HDPE',
          shape: item.shape_code || 'FTP',
          thickness: {
            metric: `${this.generateThickness()}mm`,
            imperial: `${(this.generateThickness() / 25.4).toFixed(2)}in`
          },
          width: {
            metric: `${this.generateWidth()}cm`,
            imperial: `${(this.generateWidth() / 2.54).toFixed(1)}in`
          },
          length: {
            metric: `${this.generateLength()}m`,
            imperial: `${(this.generateLength() * 3.28084).toFixed(1)}ft`
          },
          compatibility: [item.model || 'ALL']
        },
        package_type: 'box',
        image_url: item.image_url || '',
        status: 'publish' as const
      }));

      // 分页处理
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const items_paginated = filteredData.slice(startIndex, endIndex);

      console.log(`🎨 获取耗材数据 (SQL): ${items_paginated.length}/${filteredData.length}`);

      return {
        items,
        total: filteredData.length,
        total_pages: Math.ceil(filteredData.length / pageSize),
        current_page: page
      };
    }

    return await this.mockManager.getMockData(MockDataType.CONSUMABLES, params);
  }

  /**
   * 获取备件列表数据
   */
  public async getSpareParts(params?: {
    machineModel?: string;
    isConsumable?: boolean;
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<SparePartListData> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取备件数据');
        return await realApiService.getSpareParts(params);
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      let conditions: Record<string, any> = {};
      
      if (params?.isConsumable !== undefined) {
        conditions.is_consumable = params.isConsumable ? 1 : 0;
      }

      let sparePartsData = filterData('wp_bjt_spare_parts', conditions);

      // 按机型筛选
      if (params?.machineModel) {
        sparePartsData = sparePartsData.filter(item => 
          item.app_model && item.app_model.includes(params.machineModel)
        );
      }

      // 转换为前端格式
      const items = sparePartsData.map(item => ({
        id: item.id,
        product_line_id: item.product_line_id,
        part_number: item.part_number,
        name: item.name_zh,
        app_model: item.app_model || '',
        is_consumable: Boolean(item.is_consumable),
        image_url: item.image_url || '',
        spec: item.spec || '',
        spec_imperial: item.spec_imperial || '',
        app_sn: item.app_sn || 'ALL',
        status: 'publish' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // 搜索筛选
      let filteredItems = items;
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredItems = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm) ||
          item.part_number.toLowerCase().includes(searchTerm)
        );
      }

      // 分页处理
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedItems = filteredItems.slice(startIndex, endIndex);

      console.log(`🔩 获取备件数据 (SQL): ${paginatedItems.length}/${filteredItems.length}`);

      return {
        items: paginatedItems,
        total: filteredItems.length,
        total_pages: Math.ceil(filteredItems.length / pageSize),
        current_page: page
      };
    }

    return await this.mockManager.getMockData(MockDataType.SPARE_PARTS, params);
  }

  /**
   * 获取形状筛选数据
   */
  public async getShapes(): Promise<any[]> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取形状数据');
        return await realApiService.getShapes();
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      return getTableData('wp_bjt_shapes');
    }
    return [];
  }

  /**
   * 获取材料筛选数据
   */
  public async getMaterials(): Promise<any[]> {
    // 优先使用真实API
    if (this.config.useRealAPI) {
      try {
        console.log('🌐 调用真实API获取材料数据');
        return await realApiService.getMaterials();
      } catch (error) {
        console.warn('⚠️ 真实API调用失败，回退到Mock数据:', error);
        // API调用失败时回退到Mock数据
      }
    }
    
    if (this.config.useRealSQLData) {
      return getTableData('wp_bjt_materials');
    }
    return [];
  }

  /**
   * 检查Mock服务状态
   */
  public getServiceStatus(): {
    isActive: boolean;
    dataSource: string;
    totalTables: number;
    totalRecords: number;
    config: MockServiceConfig;
  } {
    const stats = sqlMockGenerator.getStatistics();
    
    // 确定数据源类型
    let dataSource = 'Mock Files';
    if (this.config.useRealAPI) {
      dataSource = 'Real API (localhost:8080)';
    } else if (this.config.useRealSQLData) {
      dataSource = 'SQL Database';
    }
    
    return {
      isActive: true,
      dataSource,
      totalTables: stats.totalTables,
      totalRecords: stats.totalRecords,
      config: this.config
    };
  }

  /**
   * 生成Mock价格
   */
  private generateMockPrice(): number {
    return parseFloat((Math.random() * 1000 + 50).toFixed(2));
  }

  /**
   * 生成Mock库存
   */
  private generateMockInventory(): number {
    return Math.floor(Math.random() * 100 + 10);
  }

  /**
   * 获取配件类型
   */
  private getAccessoryType(model?: string): string {
    if (!model) return 'other';
    
    if (model.includes('ET')) return 'transport';
    if (model.includes('FR')) return 'winder';
    if (model.includes('EC')) return 'support';
    if (model.includes('LT')) return 'lift';
    
    return 'other';
  }

  /**
   * 生成随机厚度
   */
  private generateThickness(): number {
    const thicknesses = [13, 15, 17, 20, 25, 26, 35];
    return thicknesses[Math.floor(Math.random() * thicknesses.length)];
  }

  /**
   * 生成随机宽度
   */
  private generateWidth(): number {
    const widths = [20, 40, 80];
    return widths[Math.floor(Math.random() * widths.length)];
  }

  /**
   * 生成随机长度
   */
  private generateLength(): number {
    const lengths = [10, 12, 13, 14, 16.5, 17, 17.5, 20, 28, 32, 33, 34, 34.5];
    return lengths[Math.floor(Math.random() * lengths.length)];
  }
}

// 导出单例实例
export const integratedMockService = IntegratedMockService.getInstance();

// 导出便捷方法
export const getMachinesData = (params?: any) => integratedMockService.getMachines(params);
export const getAccessoriesData = (params?: any) => integratedMockService.getAccessories(params);
export const getConsumablesData = (params?: any) => integratedMockService.getConsumables(params);
export const getSparePartsData = (params?: any) => integratedMockService.getSpareParts(params);
export const getProductLinesData = () => integratedMockService.getProductLines();
export const getShapesData = () => integratedMockService.getShapes();
export const getMaterialsData = () => integratedMockService.getMaterials();
export const getMockServiceStatus = () => integratedMockService.getServiceStatus(); 