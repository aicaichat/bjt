/**
 * SQL Mock数据生成器
 * 基于数据库SQL语句生成Mock数据，确保测试数据与实际数据结构保持一致
 */

export interface TableSchema {
  tableName: string;
  columns: ColumnSchema[];
  primaryKey: string;
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  comment?: string;
}

export interface SQLMockData {
  [tableName: string]: any[];
}

/**
 * SQL Mock数据生成器类
 */
export class SQLMockGenerator {
  private static instance: SQLMockGenerator;
  private schemas: Map<string, TableSchema> = new Map();
  private mockData: SQLMockData = {};

  private constructor() {
    this.initializeFromSQL();
  }

  public static getInstance(): SQLMockGenerator {
    if (!SQLMockGenerator.instance) {
      SQLMockGenerator.instance = new SQLMockGenerator();
    }
    return SQLMockGenerator.instance;
  }

  /**
   * 从SQL文件初始化数据
   */
  private initializeFromSQL(): void {
    console.log('🚀 开始从SQL数据生成Mock数据...');
    
    // 初始化表结构
    this.initializeSchemas();
    
    // 生成Mock数据
    this.generateMockDataFromSQL();
    
    console.log('✅ SQL Mock数据生成完成');
  }

  /**
   * 初始化数据库表结构
   */
  private initializeSchemas(): void {
    // 产品线表
    this.schemas.set('wp_bjt_product_lines', {
      tableName: 'wp_bjt_product_lines',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'title_zh', type: 'varchar', nullable: false, comment: '中文标题' },
        { name: 'title_en', type: 'varchar', nullable: false, comment: '英文标题' },
        { name: 'description_zh', type: 'text', nullable: true, comment: '中文描述' },
        { name: 'description_en', type: 'text', nullable: true, comment: '英文描述' },
        { name: 'code', type: 'varchar', nullable: false, comment: '产品线代码' },
        { name: 'image_url', type: 'varchar', nullable: true, comment: '图片URL' },
        { name: 'status', type: 'varchar', nullable: false, defaultValue: 'publish' },
        { name: 'sort_order', type: 'int', nullable: true, defaultValue: 0 }
      ]
    });

    // 主机型号表
    this.schemas.set('wp_bjt_host_models', {
      tableName: 'wp_bjt_host_models',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'model', type: 'varchar', nullable: false, comment: '主机型号编码' },
        { name: 'title_zh', type: 'varchar', nullable: false, comment: '中文名称' },
        { name: 'title_en', type: 'varchar', nullable: false, comment: '英文名称' },
        { name: 'description_zh', type: 'text', nullable: true },
        { name: 'description_en', type: 'text', nullable: true },
        { name: 'type', type: 'varchar', nullable: true },
        { name: 'image1_url', type: 'varchar', nullable: true },
        { name: 'status', type: 'varchar', nullable: false, defaultValue: 'publish' }
      ]
    });

    // 主机料号表
    this.schemas.set('wp_bjt_parts', {
      tableName: 'wp_bjt_parts',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'model', type: 'varchar', nullable: false },
        { name: 'voltage', type: 'varchar', nullable: true },
        { name: 'part_number', type: 'varchar', nullable: false, comment: '料号' },
        { name: 'name_zh', type: 'varchar', nullable: false, comment: '中文名称' },
        { name: 'name_en', type: 'varchar', nullable: false, comment: '英文名称' },
        { name: 'brand', type: 'varchar', nullable: true },
        { name: 'image_url', type: 'varchar', nullable: true },
        { name: 'unit', type: 'varchar', nullable: false, defaultValue: 'pcs' }
      ]
    });

    // 配件表
    this.schemas.set('wp_bjt_accessories', {
      tableName: 'wp_bjt_accessories',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'model', type: 'varchar', nullable: true },
        { name: 'part_number', type: 'varchar', nullable: false },
        { name: 'name_zh', type: 'varchar', nullable: false },
        { name: 'name_en', type: 'varchar', nullable: false },
        { name: 'brand', type: 'varchar', nullable: true },
        { name: 'voltage', type: 'varchar', nullable: true },
        { name: 'image_url', type: 'varchar', nullable: true },
        { name: 'unit', type: 'varchar', nullable: false, defaultValue: 'pcs' }
      ]
    });

    // 耗材表
    this.schemas.set('wp_bjt_consumables', {
      tableName: 'wp_bjt_consumables',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'model', type: 'varchar', nullable: false },
        { name: 'part_number', type: 'varchar', nullable: false },
        { name: 'spec', type: 'varchar', nullable: true },
        { name: 'material', type: 'varchar', nullable: true },
        { name: 'thickness_met', type: 'decimal', nullable: true },
        { name: 'width_met', type: 'decimal', nullable: true },
        { name: 'length_met', type: 'decimal', nullable: true },
        { name: 'image_url', type: 'varchar', nullable: true },
        { name: 'unit', type: 'varchar', nullable: false, defaultValue: 'roll' }
      ]
    });

    // 备件表
    this.schemas.set('wp_bjt_spare_parts', {
      tableName: 'wp_bjt_spare_parts',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'app_model', type: 'varchar', nullable: true },
        { name: 'part_number', type: 'varchar', nullable: false },
        { name: 'name_zh', type: 'varchar', nullable: false },
        { name: 'name_en', type: 'varchar', nullable: false },
        { name: 'is_consumable', type: 'tinyint', nullable: true, defaultValue: 0 },
        { name: 'image_url', type: 'varchar', nullable: true },
        { name: 'unit', type: 'varchar', nullable: false, defaultValue: 'pcs' }
      ]
    });

    // 形状表
    this.schemas.set('wp_bjt_shapes', {
      tableName: 'wp_bjt_shapes',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'code', type: 'varchar', nullable: false },
        { name: 'name_zh', type: 'varchar', nullable: false },
        { name: 'name_en', type: 'varchar', nullable: false },
        { name: 'image_url', type: 'varchar', nullable: true },
        { name: 'status', type: 'varchar', nullable: false, defaultValue: 'publish' }
      ]
    });

    // 材料表
    this.schemas.set('wp_bjt_materials', {
      tableName: 'wp_bjt_materials',
      primaryKey: 'id',
      columns: [
        { name: 'id', type: 'bigint', nullable: false },
        { name: 'product_line_id', type: 'bigint', nullable: false },
        { name: 'code', type: 'varchar', nullable: false },
        { name: 'name_zh', type: 'varchar', nullable: false },
        { name: 'name_en', type: 'varchar', nullable: false },
        { name: 'status', type: 'varchar', nullable: false, defaultValue: 'publish' }
      ]
    });
  }

  /**
   * 从SQL数据生成Mock数据 - 严格按照数据库表结构
   */
  private generateMockDataFromSQL(): void {
    // 产品线数据 - 严格按照 wp_bjt_product_lines 表结构
    this.mockData.wp_bjt_product_lines = [
      {
        id: 1,
        title_zh: '气垫系列',
        title_en: 'Air Cushioning System',
        description_zh: '专业气垫机生产商，为您提供高效创新的气垫系统解决方案',
        description_en: 'Reliable Air Cushion Machine Manufacturer Offers Efficient and Innovative Air Cushion System Solutions',
        subitem1_zh: '缓冲气垫机',
        subitem1_en: 'Air Cushion Machine',
        subitem2_zh: '缓冲气垫膜',
        subitem2_en: 'Air Cushion Film',
        subitem3_zh: '缓冲气垫外设配件',
        subitem3_en: 'Air Cushion Accessories',
        image_url: '/uploads/product_lines/Air Cushioning System.jpg',
        code: 'air_cushion',
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        title_zh: '纸垫系列',
        title_en: 'Paper Cushioning Machine',
        description_zh: '专业牛皮纸缓冲机，将优质原纸转化为高强度的缓冲防护系统，为产品运输提供卓越保障。',
        description_en: 'Premium Kraft Paper Cushioning System machine transforms high-quality kraft paper into durable three-dimensional cushioning materials, offering superior product protection.',
        subitem1_zh: '缓冲纸垫机',
        subitem1_en: 'Paper Cushion Machine',
        subitem2_zh: '缓冲牛皮纸',
        subitem2_en: 'Paper',
        subitem3_zh: '缓冲纸垫外设配件',
        subitem3_en: 'Paper Cushion Accessories',
        image_url: '/uploads/product_lines/Paper Cushioning Machine.jpg',
        code: 'paper_machine',
        status: 'publish',
        sort_order: 20,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 3,
        title_zh: '胶带系列',
        title_en: 'Water Activated Tape Dispenser',
        description_zh: '专业封箱设备,提高包装效率和安全性。',
        description_en: 'Professional box sealing equipment to improve packaging efficiency and security.',
        subitem1_zh: '湿水胶带机',
        subitem1_en: 'Water-Activated Tape Dispenser',
        subitem2_zh: '湿水胶带',
        subitem2_en: 'Water-Activated Tape',
        subitem3_zh: '湿水胶带机外设配件',
        subitem3_en: 'Dispenser Accessories',
        image_url: '/uploads/product_lines/Water Activated Tape Dispenser.jpg',
        code: 'tape_machine',
        status: 'publish',
        sort_order: 30,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      }
    ];

    // 主机型号数据 - 严格按照 wp_bjt_host_models 表结构
    this.mockData.wp_bjt_host_models = [
      {
        id: 1,
        product_line_id: 1,
        model: '"LA-E4S V2.0"',
        title_zh: '"LA-E4S V2.0" 商用型缓冲气垫机',
        title_en: '"LA-E4S V2.0" Business Class Air Cushion Pillow & Bubble System',
        description_zh: '专为中型企业用户设计的高性价比气垫机',
        description_en: 'Cost-effective air cushion machine designed for medium-sized enterprise users',
        type: '',
        image1_url: '/uploads/host/LA-E4S V2.0.jpg',
        image2_url: null,
        explosion_diagram_pdf: null,
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        product_line_id: 1,
        model: 'LA-E4S(paper)',
        title_zh: 'LA-E4S(paper)商用型缓冲气垫机',
        title_en: 'LA-E4S(paper)Business Class Paper Air Bubble System',
        description_zh: '专为中型企业用户设计的高性价比气垫机',
        description_en: 'Cost-effective air cushion machine designed for medium-sized enterprise users',
        type: '',
        image1_url: '/uploads/host/LA-E4S(paper).jpg',
        image2_url: null,
        explosion_diagram_pdf: null,
        status: 'publish',
        sort_order: 20,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      }
    ];

    // 主机料号数据 - 严格按照 wp_bjt_parts 表结构（包含完整字段）
    this.mockData.wp_bjt_parts = [
      {
        id: 1,
        product_line_id: 1,
        model: '"LA-E4S V2.0"',
        voltage: '110V',
        image_url: '/uploads/host/LA-E4S V2.0.jpg',
        part_number: '60A01143',
        name_zh: '"LA-E4S V2.0"主机-标准版',
        name_en: '"LA-E4S V2.0" Host-Standard',
        brand: 'Lockdeair',
        spec: 'Business Class Air Cushion Pillow & Bubble System,AC220V',
        spec_imperial: 'Business Class Air Cushion Pillow & Bubble System,AC220V',
        package_size_cm: '40×34.5×39',
        package_size_inch: '15.7×13.6×15.4',
        net_weight_kg: 8.8,
        net_weight_lbs: 19.4,
        gross_weight_kg: 10.8,
        gross_weight_lbs: 23.8,
        pcs_per_box: 1,
        pallet_size_cm: '100×120',
        pallet_size_inch: '39.4×47.2',
        pcs_per_pallet: 24,
        pallet_height_cm: 185,
        pallet_height_inch: 72.8,
        pallet_gross_weight_kg: 284,
        pallet_gross_weight_lbs: 626.1,
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 2,
        product_line_id: 1,
        model: '"LA-E4S V2.0"',
        voltage: '220V',
        image_url: '/uploads/host/LA-E4S V2.0.jpg',
        part_number: '60A01141',
        name_zh: '"LA-E4S V2.0"主机-美标版',
        name_en: 'LA-E4S V2.0 Host-US Version',
        brand: 'Lockdeair',
        spec: 'Business Class Air Cushion Pillow & Bubble System,AC110V',
        spec_imperial: 'Business Class Air Cushion Pillow & Bubble System,AC110V',
        package_size_cm: '40×34.5×39',
        package_size_inch: '15.7×13.6×15.4',
        net_weight_kg: 8.8,
        net_weight_lbs: 19.4,
        gross_weight_kg: 10.8,
        gross_weight_lbs: 23.8,
        pcs_per_box: 1,
        pallet_size_cm: '100×120',
        pallet_size_inch: '39.4×47.2',
        pcs_per_pallet: 24,
        pallet_height_cm: 185,
        pallet_height_inch: 72.8,
        pallet_gross_weight_kg: 284,
        pallet_gross_weight_lbs: 626.1,
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 3,
        product_line_id: 1,
        model: 'LA-E4S(paper)',
        voltage: '110V',
        image_url: '/uploads/host/LA-E4S(paper).jpg',
        part_number: '60A01148',
        name_zh: 'LA-E4S(paper)主机-标准版',
        name_en: 'LA-E4S(paper) Host-Standard',
        brand: 'Lockdeair',
        spec: 'Business Class Paper Air Bubble System,AC220V',
        spec_imperial: 'Business Class Paper Air Bubble System,AC220V',
        package_size_cm: '40×34.5×39',
        package_size_inch: '15.7×13.6×15.4',
        net_weight_kg: 8.8,
        net_weight_lbs: 19.4,
        gross_weight_kg: 10.8,
        gross_weight_lbs: 23.8,
        pcs_per_box: 1,
        pallet_size_cm: '100×120',
        pallet_size_inch: '39.4×47.2',
        pcs_per_pallet: 24,
        pallet_height_cm: 185,
        pallet_height_inch: 72.8,
        pallet_gross_weight_kg: 284,
        pallet_gross_weight_lbs: 626.1,
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 4,
        product_line_id: 1,
        model: 'LA-E4S(paper)',
        voltage: '220V',
        image_url: '/uploads/host/LA-E4S(paper).jpg',
        part_number: '60A01149',
        name_zh: 'LA-E4S(paper)主机-美标版',
        name_en: 'LA-E4S(paper) Host-US Version',
        brand: 'Lockdeair',
        spec: 'Business Class Paper Air Bubble System,AC110V',
        spec_imperial: 'Business Class Paper Air Bubble System,AC110V',
        package_size_cm: '40×34.5×39',
        package_size_inch: '15.7×13.6×15.4',
        net_weight_kg: 8.8,
        net_weight_lbs: 19.4,
        gross_weight_kg: 10.8,
        gross_weight_lbs: 23.8,
        pcs_per_box: 1,
        pallet_size_cm: '100×120',
        pallet_size_inch: '39.4×47.2',
        pcs_per_pallet: 24,
        pallet_height_cm: 185,
        pallet_height_inch: 72.8,
        pallet_gross_weight_kg: 284,
        pallet_gross_weight_lbs: 626.1,
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      }
    ];

    // 配件数据 - 严格按照 wp_bjt_accessories 表结构（包含所有字段）
    this.mockData.wp_bjt_accessories = [
      {
        id: 1,
        product_line_id: 1,
        model: 'ET400',
        brand: 'Lockedair',
        part_number: '60A04038',
        name_zh: 'ET400 自动分离器',
        name_en: 'ET400 Auto Separator',
        spec: 'ET400 Auto Separator,AC110V',
        spec_imperial: 'ET400 Auto Separator,AC110V',
        voltage: '110V',
        frequency: null,
        package_size_cm: '59.5×34.5×43',
        package_size_inch: '23.4×13.6×16.8',
        net_weight_kg: 25.0,
        net_weight_lbs: 55.1,
        gross_weight_kg: 26.86,
        gross_weight_lbs: 29.2,
        pcs_per_box: 1,
        pallet_size_cm: '110×110',
        pallet_size_inch: '43.3×43.3',
        pcs_per_pallet: 16,
        pallet_height_cm: 240.0,
        pallet_height_inch: 94.5,
        pallet_gross_weight_kg: 435.0,
        pallet_gross_weight_lbs: 959.0,
        image_url: '/uploads/accessory/ET400.jpg',
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 2,
        product_line_id: 1,
        model: 'ET400',
        brand: 'Lockedair',
        part_number: '60A04029',
        name_zh: 'ET400 自动分离器',
        name_en: 'ET400 Auto Separator',
        spec: 'ET400 Auto Separator,AC220V',
        spec_imperial: 'ET400 Auto Separator,AC220V',
        voltage: '220V',
        frequency: null,
        package_size_cm: '59.5×34.5×43',
        package_size_inch: '23.4×13.6×16.8',
        net_weight_kg: 25.0,
        net_weight_lbs: 55.1,
        gross_weight_kg: 26.86,
        gross_weight_lbs: 29.2,
        pcs_per_box: 1,
        pallet_size_cm: '110×110',
        pallet_size_inch: '43.3×43.3',
        pcs_per_pallet: 16,
        pallet_height_cm: 240.0,
        pallet_height_inch: 94.5,
        pallet_gross_weight_kg: 435.0,
        pallet_gross_weight_lbs: 959.0,
        image_url: '/uploads/accessory/ET400.jpg',
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 3,
        product_line_id: 1,
        model: 'ET1003',
        brand: 'Lockedair',
        part_number: '60A10001',
        name_zh: 'ET1003 气垫输送系统',
        name_en: 'ET1003 Air Cushion Delivery System',
        spec: 'ET1003 Air Cushion Delivery System,AC110V,50HZ',
        spec_imperial: 'ET1003 Air Cushion Delivery System,AC110V,50HZ',
        voltage: '110V',
        frequency: '50HZ',
        package_size_cm: '106.5×51.5×77',
        package_size_inch: '41.9×20.3×30.3',
        net_weight_kg: 95.0,
        net_weight_lbs: 209.4,
        gross_weight_kg: 101.3,
        gross_weight_lbs: 223.3,
        pcs_per_box: 1,
        pallet_size_cm: null,
        pallet_size_inch: null,
        pcs_per_pallet: null,
        pallet_height_cm: null,
        pallet_height_inch: null,
        pallet_gross_weight_kg: null,
        pallet_gross_weight_lbs: null,
        image_url: '/uploads/accessory/ET1003.jpg',
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 4,
        product_line_id: 1,
        model: 'FR8002',
        brand: 'Lockedair',
        part_number: '60A11002',
        name_zh: 'FR8002 收卷车',
        name_en: 'FR8002 Winder Cart',
        spec: 'FR8002 Winder Cart,AC110V',
        spec_imperial: 'FR8002 Winder Cart,AC110V',
        voltage: '110V',
        frequency: null,
        package_size_cm: '99.5×54.5×36',
        package_size_inch: '39.2×21.5×14.2',
        net_weight_kg: 39.0,
        net_weight_lbs: 86.0,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: 1,
        pallet_size_cm: null,
        pallet_size_inch: null,
        pcs_per_pallet: null,
        pallet_height_cm: null,
        pallet_height_inch: null,
        pallet_gross_weight_kg: null,
        pallet_gross_weight_lbs: null,
        image_url: '/uploads/accessory/FR8002.jpg',
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      }
    ];

    // 备件数据 - 严格按照 wp_bjt_spare_parts 表结构（包含所有字段）
    this.mockData.wp_bjt_spare_parts = [
      {
        id: 1,
        product_line_id: 1,
        app_model: '"LA-E4S V2.0",LA-E4S(paper)',
        model: null,
        is_consumable: 1,
        image_url: '/uploads/spare_parts/08A0105795.jpg',
        part_number: '08A0105795',
        name_zh: '8A 保险丝',
        name_en: '8A Fuse',
        spec: '8A Fuse For "LA-E4S V2.0",LA-E4S(paper) AC100-240V',
        spec_imperial: '8A Fuse For "LA-E4S V2.0",LA-E4S(paper) AC100-240V',
        app_sn: 'ALL',
        package_size_cm: null,
        package_size_inch: null,
        net_weight_kg: 0.01,
        net_weight_lbs: 0.2,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: 1,
        required_parts: null,
        required_quantity: null,
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 2,
        product_line_id: 1,
        app_model: '"LA-E4S V2.0",LA-E4S(paper)',
        model: null,
        is_consumable: 1,
        image_url: '/uploads/spare_parts/01A0101038.jpg',
        part_number: '01A0101038',
        name_zh: '去皱硅胶',
        name_en: 'Wrinkle Removal Silicone Gel',
        spec: 'Wrinkle Removal Silicone Gel For "LA-E4S V2.0",LA-E4S(paper) AC100-240V',
        spec_imperial: 'Wrinkle Removal Silicone Gel For "LA-E4S V2.0",LA-E4S(paper) AC100-240V',
        app_sn: 'ALL',
        package_size_cm: null,
        package_size_inch: null,
        net_weight_kg: 0.1,
        net_weight_lbs: 0.2,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: 1,
        required_parts: '11A0103002,11A0101003',
        required_quantity: '2,2',
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      },
      {
        id: 3,
        product_line_id: 1,
        app_model: '"LA-E4S V2.0",LA-E4S(paper)',
        model: null,
        is_consumable: 1,
        image_url: '/uploads/spare_parts/07A0105325.jpg',
        part_number: '07A0105325',
        name_zh: '陶瓷刀片',
        name_en: 'Ceramic Blade',
        spec: 'Ceramic Blade For "LA-E4S V2.0",LA-E4S(paper) AC100-240V',
        spec_imperial: 'Ceramic Blade For "LA-E4S V2.0",LA-E4S(paper) AC100-240V',
        app_sn: 'ALL',
        package_size_cm: null,
        package_size_inch: null,
        net_weight_kg: 0.1,
        net_weight_lbs: 0.2,
        gross_weight_kg: null,
        gross_weight_lbs: null,
        pcs_per_box: 1,
        required_parts: '11A0103157,11A0101002',
        required_quantity: '1,1',
        status: 'publish',
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00',
        unit: 'pcs'
      }
    ];

    // 耗材形状数据 - 严格按照 wp_bjt_shapes 表结构
    this.mockData.wp_bjt_shapes = [
      {
        id: 1,
        product_line_id: 1,
        code: 'FTB',
        name_zh: '气垫',
        name_en: 'Air Pillows',
        image_url: '\\images\\FTB\\values\\FTB.png',
        image_url2: '\\images\\FTB\\values\\FTB-2.png',
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        product_line_id: 1,
        code: 'FTP',
        name_zh: '薄膜',
        name_en: 'Film',
        image_url: '\\images\\FTP\\values\\FTP.png',
        image_url2: '\\images\\FTP\\values\\FTP-2.png',
        status: 'publish',
        sort_order: 20,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 3,
        product_line_id: 1,
        code: 'MFC',
        name_zh: '气枕膜',
        name_en: 'Tube',
        image_url: '\\images\\MFC\\values\\MFC.png',
        image_url2: '\\images\\MFC\\values\\MFC-2.png',
        status: 'publish',
        sort_order: 40,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 4,
        product_line_id: 1,
        code: 'MFF',
        name_zh: '葫芦膜',
        name_en: 'Bubble',
        image_url: '\\images\\MFF\\values\\MFF.png',
        image_url2: '\\images\\MFF\\values\\MFF-2.png',
        status: 'publish',
        sort_order: 50,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      }
    ];

    // 耗材材料数据 - 严格按照 wp_bjt_materials 表结构
    this.mockData.wp_bjt_materials = [
      {
        id: 1,
        product_line_id: 1,
        code: '30% HDPE',
        name_zh: '30%回料HDPE',
        name_en: '30%Recycled HDPE',
        base_material: null,
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        product_line_id: 1,
        code: '50% HDPE',
        name_zh: '50%回料HDPE',
        name_en: '50%Recycled HDPE',
        base_material: null,
        status: 'publish',
        sort_order: 20,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 3,
        product_line_id: 1,
        code: 'HDPE',
        name_zh: 'HDPE',
        name_en: 'HDPE',
        base_material: null,
        status: 'publish',
        sort_order: 30,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 4,
        product_line_id: 1,
        code: '50% LDPE',
        name_zh: '50%回料LDPE',
        name_en: '50%Recycled LDPE',
        base_material: null,
        status: 'publish',
        sort_order: 40,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 5,
        product_line_id: 1,
        code: 'LDPE',
        name_zh: 'LDPE',
        name_en: 'LDPE',
        base_material: null,
        status: 'publish',
        sort_order: 50,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      }
    ];

    // 耗材规格数据 - 严格按照 wp_bjt_specifications 表结构
    this.mockData.wp_bjt_specifications = [
      {
        id: 1,
        product_line_id: 1,
        spec_type: 'thickness',
        metric_value: 13.0,
        metric_unit: 'um',
        imperial_value: 0.5,
        imperial_unit: 'mil',
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 2,
        product_line_id: 1,
        spec_type: 'thickness',
        metric_value: 20.0,
        metric_unit: 'um',
        imperial_value: 0.8,
        imperial_unit: 'mil',
        status: 'publish',
        sort_order: 40,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 3,
        product_line_id: 1,
        spec_type: 'width',
        metric_value: 20.0,
        metric_unit: 'cm',
        imperial_value: 8.0,
        imperial_unit: 'inch',
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 4,
        product_line_id: 1,
        spec_type: 'width',
        metric_value: 40.0,
        metric_unit: 'cm',
        imperial_value: 16.0,
        imperial_unit: 'inch',
        status: 'publish',
        sort_order: 20,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 5,
        product_line_id: 1,
        spec_type: 'length',
        metric_value: 10.0,
        metric_unit: 'cm',
        imperial_value: 4.0,
        imperial_unit: 'inch',
        status: 'publish',
        sort_order: 10,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      },
      {
        id: 6,
        product_line_id: 1,
        spec_type: 'length',
        metric_value: 20.0,
        metric_unit: 'cm',
        imperial_value: 8.0,
        imperial_unit: 'inch',
        status: 'publish',
        sort_order: 80,
        created_at: '2024-01-01 00:00:00',
        updated_at: '2024-01-01 00:00:00'
      }
    ];

    console.log(`📊 生成了 ${Object.keys(this.mockData).length} 个表的Mock数据`);
  }

  /**
   * 获取指定表的Mock数据
   */
  public getTableData(tableName: string): any[] {
    return this.mockData[tableName] || [];
  }

  /**
   * 获取所有Mock数据
   */
  public getAllData(): SQLMockData {
    return { ...this.mockData };
  }

  /**
   * 获取表结构
   */
  public getTableSchema(tableName: string): TableSchema | undefined {
    return this.schemas.get(tableName);
  }

  /**
   * 获取所有表结构
   */
  public getAllSchemas(): TableSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * 根据条件筛选数据
   */
  public filterData(tableName: string, conditions: Record<string, any>): any[] {
    const data = this.getTableData(tableName);
    return data.filter(item => {
      return Object.entries(conditions).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        return item[key] === value;
      });
    });
  }

  /**
   * 根据ID获取单条数据
   */
  public getById(tableName: string, id: number): any | undefined {
    const data = this.getTableData(tableName);
    return data.find(item => item.id === id);
  }

  /**
   * 分页获取数据
   */
  public getPaginatedData(tableName: string, page: number = 1, pageSize: number = 10): {
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    const allData = this.getTableData(tableName);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = allData.slice(startIndex, endIndex);
    
    return {
      items,
      total: allData.length,
      page,
      pageSize,
      totalPages: Math.ceil(allData.length / pageSize)
    };
  }

  /**
   * 统计信息
   */
  public getStatistics(): {
    totalTables: number;
    totalRecords: number;
    tableStats: Array<{
      tableName: string;
      recordCount: number;
      columns: number;
    }>;
  } {
    const tableStats = Object.entries(this.mockData).map(([tableName, data]) => ({
      tableName,
      recordCount: data.length,
      columns: this.schemas.get(tableName)?.columns.length || 0
    }));

    return {
      totalTables: Object.keys(this.mockData).length,
      totalRecords: Object.values(this.mockData).reduce((sum, data) => sum + data.length, 0),
      tableStats
    };
  }
}

// 导出单例实例
export const sqlMockGenerator = SQLMockGenerator.getInstance();

// 导出便捷方法
export const getTableData = (tableName: string) => sqlMockGenerator.getTableData(tableName);
export const filterData = (tableName: string, conditions: Record<string, any>) => 
  sqlMockGenerator.filterData(tableName, conditions);
export const getById = (tableName: string, id: number) => sqlMockGenerator.getById(tableName, id);
export const getPaginatedData = (tableName: string, page?: number, pageSize?: number) => 
  sqlMockGenerator.getPaginatedData(tableName, page, pageSize);