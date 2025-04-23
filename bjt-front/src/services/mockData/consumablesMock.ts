// 耗材模拟数据
export interface Consumable {
  id: string;
  code: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  category: 'film' | 'paper' | 'tape' | 'other';
  image_url: string;
  unit: string;
  specifications: ConsumableSpecification;
  compatibility: string[];
  inventory: ConsumableInventory[];
  prices: ConsumablePrices;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ConsumableSpecification {
  dimensions: string;
  dimensions_imperial?: string;
  material: string;
  weight: string;
  weight_imperial?: string;
  packaging?: string;
  performance?: string;
  other?: Record<string, string>;
}

export interface ConsumableInventory {
  region: string;
  amount: number;
  unit: string;
}

export interface ConsumablePrices {
  base: number;
  tier1: number;
  tier2: number;
  vip: number;
}

export const mockConsumables: Consumable[] = [
  {
    id: 'FILM-001',
    code: 'AC-FILM-200',
    name: '标准气垫膜 - 200mm',
    name_en: 'Standard Air Cushion Film - 200mm',
    description: '优质气垫膜，适用于所有LP系列气垫机，提供出色的产品保护和减震效果',
    description_en: 'Premium air cushion film compatible with all LP series machines, providing excellent product protection and shock absorption',
    category: 'film',
    image_url: '/images/shop/film-200.jpg',
    unit: '卷',
    specifications: {
      dimensions: '200mm × 400m',
      dimensions_imperial: '7.9in × 1312ft',
      material: 'LDPE',
      weight: '4.5kg/卷',
      weight_imperial: '9.9lbs/roll',
      packaging: '4卷/箱',
      performance: '减震率>95%'
    },
    compatibility: ['LP-V1', 'LP-F1', 'LP-P1', 'MEY-001'],
    inventory: [
      { region: 'CN', amount: 560, unit: '卷' },
      { region: 'EU', amount: 240, unit: '卷' },
      { region: 'NA', amount: 320, unit: '卷' },
      { region: 'AU', amount: 160, unit: '卷' }
    ],
    prices: {
      base: 180,
      tier1: 160,
      tier2: 145,
      vip: 130
    },
    status: 'in_stock'
  },
  {
    id: 'FILM-002',
    code: 'AC-FILM-400',
    name: '宽幅气垫膜 - 400mm',
    name_en: 'Wide Air Cushion Film - 400mm',
    description: '宽幅气垫膜，适用于大型产品的包装，提供更广泛的覆盖范围',
    description_en: 'Wide format air cushion film for packaging larger products, providing broader coverage',
    category: 'film',
    image_url: '/images/shop/film-400.jpg',
    unit: '卷',
    specifications: {
      dimensions: '400mm × 300m',
      dimensions_imperial: '15.7in × 984ft',
      material: 'LDPE',
      weight: '6.8kg/卷',
      weight_imperial: '15lbs/roll',
      packaging: '2卷/箱',
      performance: '减震率>95%'
    },
    compatibility: ['LP-V1', 'LP-F1', 'MEY-001'],
    inventory: [
      { region: 'CN', amount: 380, unit: '卷' },
      { region: 'EU', amount: 180, unit: '卷' },
      { region: 'NA', amount: 220, unit: '卷' },
      { region: 'AU', amount: 120, unit: '卷' }
    ],
    prices: {
      base: 320,
      tier1: 290,
      tier2: 265,
      vip: 240
    },
    status: 'in_stock'
  },
  {
    id: 'PAPER-001',
    code: 'PC-PAPER-380',
    name: '标准纸垫原纸 - 380mm',
    name_en: 'Standard Paper Cushion Roll - 380mm',
    description: '环保纸垫原纸，使用100%可回收材料，适用于MFA系列纸垫机',
    description_en: 'Eco-friendly paper cushion roll, made from 100% recyclable materials, compatible with MFA series machines',
    category: 'paper',
    image_url: '/images/shop/paper-380.jpg',
    unit: '卷',
    specifications: {
      dimensions: '380mm × 450m',
      dimensions_imperial: '15in × 1476ft',
      material: '牛皮纸',
      weight: '12kg/卷',
      weight_imperial: '26.5lbs/roll',
      packaging: '1卷/箱',
      performance: '抗压强度>5kPa'
    },
    compatibility: ['MFA-002'],
    inventory: [
      { region: 'CN', amount: 450, unit: '卷' },
      { region: 'EU', amount: 220, unit: '卷' },
      { region: 'NA', amount: 280, unit: '卷' },
      { region: 'AU', amount: 140, unit: '卷' }
    ],
    prices: {
      base: 220,
      tier1: 200,
      tier2: 180,
      vip: 160
    },
    status: 'in_stock'
  },
  {
    id: 'TAPE-001',
    code: 'WAT-48-150',
    name: '水激活胶带 - 48mm',
    name_en: 'Water Activated Tape - 48mm',
    description: '专业水激活胶带，提供超强粘合力，适用于各种纸箱封装',
    description_en: 'Professional water activated tape, providing superior adhesion for various carton sealing applications',
    category: 'tape',
    image_url: '/images/shop/tape-48.jpg',
    unit: '卷',
    specifications: {
      dimensions: '48mm × 150m',
      dimensions_imperial: '1.9in × 492ft',
      material: '牛皮纸+淀粉胶',
      weight: '0.8kg/卷',
      weight_imperial: '1.8lbs/roll',
      packaging: '24卷/箱',
      performance: '粘合强度>2.5N/cm'
    },
    compatibility: ['TBY-003'],
    inventory: [
      { region: 'CN', amount: 840, unit: '卷' },
      { region: 'EU', amount: 480, unit: '卷' },
      { region: 'NA', amount: 560, unit: '卷' },
      { region: 'AU', amount: 360, unit: '卷' }
    ],
    prices: {
      base: 25,
      tier1: 22,
      tier2: 20,
      vip: 18
    },
    status: 'in_stock'
  },
  {
    id: 'TAPE-002',
    code: 'WAT-72-150',
    name: '宽幅水激活胶带 - 72mm',
    name_en: 'Wide Water Activated Tape - 72mm',
    description: '宽幅水激活胶带，适用于重型包装和高安全性需求的场景',
    description_en: 'Wide water activated tape for heavy-duty packaging and high-security applications',
    category: 'tape',
    image_url: '/images/shop/tape-72.jpg',
    unit: '卷',
    specifications: {
      dimensions: '72mm × 150m',
      dimensions_imperial: '2.8in × 492ft',
      material: '牛皮纸+淀粉胶',
      weight: '1.2kg/卷',
      weight_imperial: '2.6lbs/roll',
      packaging: '16卷/箱',
      performance: '粘合强度>2.8N/cm'
    },
    compatibility: ['TBY-003'],
    inventory: [
      { region: 'CN', amount: 640, unit: '卷' },
      { region: 'EU', amount: 320, unit: '卷' },
      { region: 'NA', amount: 400, unit: '卷' },
      { region: 'AU', amount: 240, unit: '卷' }
    ],
    prices: {
      base: 35,
      tier1: 32,
      tier2: 29,
      vip: 26
    },
    status: 'in_stock'
  }
]; 