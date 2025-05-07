import { AccessoryProduct } from '../types/accessories';

// Accessories mock data
export const accessoriesMock: AccessoryProduct[] = [
  {
    id: 'acc-001',
    name: '标准电源线',
    name_en: 'Standard Power Cord',
    code: 'PWR-001',
    part_number: 'PWR-001',
    model: 'PWR-001',
    type: 'power_cord',
    image_url: '/images/accessories/power-cord.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: '220V',
    frequency: '50Hz',
    spec: '2.5m',
    spec_imperial: '8.2ft',
    package_size: '30x20x5cm',
    package_size_imperial: '11.8x7.9x2in',
    net_weight: 0.5,
    net_weight_imperial: 1.1,
    gross_weight: 0.6,
    gross_weight_imperial: 1.3,
    box_quantity: 20,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 400,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 240,
    pallet_gross_weight_imperial: 529,
    prices: {
      current: 15.99,
      original: 19.99,
      tiers: [
        { range: '1-9', price: 15.99 },
        { range: '10-49', price: 14.99 },
        { range: '50-99', price: 13.99 },
        { range: '100+', price: 12.99 }
      ]
    },
    inventory: {
      total: 1000,
      eu: 300,
      na: 300,
      au: 200,
      cn: 200
    }
  },
  {
    id: 'acc-002',
    name: '延长电源线',
    name_en: 'Extension Power Cord',
    code: 'PWR-002',
    part_number: 'PWR-002',
    model: 'PWR-002',
    type: 'power_cord',
    image_url: '/images/accessories/extension-cord.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: '220V',
    frequency: '50Hz',
    spec: '5m',
    spec_imperial: '16.4ft',
    package_size: '35x25x5cm',
    package_size_imperial: '13.8x9.8x2in',
    net_weight: 0.8,
    net_weight_imperial: 1.8,
    gross_weight: 0.9,
    gross_weight_imperial: 2,
    box_quantity: 15,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 300,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 270,
    pallet_gross_weight_imperial: 595,
    prices: {
      current: 24.99,
      original: 29.99,
      tiers: [
        { range: '1-9', price: 24.99 },
        { range: '10-49', price: 23.99 },
        { range: '50-99', price: 22.99 },
        { range: '100+', price: 21.99 }
      ]
    },
    inventory: {
      total: 800,
      eu: 250,
      na: 250,
      au: 150,
      cn: 150
    }
  },
  {
    id: 'acc-003',
    name: '气垫机过滤网',
    name_en: 'Air Cushion Machine Filter',
    code: 'FLT-001',
    part_number: 'FLT-001',
    model: 'FLT-001',
    type: 'filter',
    image_url: '/images/accessories/filter.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: 'N/A',
    frequency: 'N/A',
    spec: '15x10cm',
    spec_imperial: '5.9x3.9in',
    package_size: '20x15x2cm',
    package_size_imperial: '7.9x5.9x0.8in',
    net_weight: 0.05,
    net_weight_imperial: 0.11,
    gross_weight: 0.1,
    gross_weight_imperial: 0.22,
    box_quantity: 50,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 5000,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 500,
    pallet_gross_weight_imperial: 1102,
    prices: {
      current: 9.99,
      original: 12.99,
      tiers: [
        { range: '1-9', price: 9.99 },
        { range: '10-49', price: 8.99 },
        { range: '50-99', price: 7.99 },
        { range: '100+', price: 6.99 }
      ]
    },
    inventory: {
      total: 2000,
      eu: 600,
      na: 600,
      au: 400,
      cn: 400
    }
  },
  {
    id: 'acc-004',
    name: '打印机墨盒',
    name_en: 'Printer Ink Cartridge',
    code: 'INK-001',
    part_number: 'INK-001',
    model: 'INK-001',
    type: 'consumable',
    image_url: '/images/accessories/ink-cartridge.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: 'N/A',
    frequency: 'N/A',
    spec: '5x3x10cm',
    spec_imperial: '2x1.2x3.9in',
    package_size: '8x5x12cm',
    package_size_imperial: '3.1x2x4.7in',
    net_weight: 0.1,
    net_weight_imperial: 0.22,
    gross_weight: 0.15,
    gross_weight_imperial: 0.33,
    box_quantity: 24,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 1200,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 180,
    pallet_gross_weight_imperial: 397,
    prices: {
      current: 29.99,
      original: 34.99,
      tiers: [
        { range: '1-9', price: 29.99 },
        { range: '10-49', price: 27.99 },
        { range: '50-99', price: 25.99 },
        { range: '100+', price: 23.99 }
      ]
    },
    inventory: {
      total: 500,
      eu: 150,
      na: 150,
      au: 100,
      cn: 100
    }
  },
  {
    id: 'acc-005',
    name: '机器防尘罩',
    name_en: 'Machine Dust Cover',
    code: 'CVR-001',
    part_number: 'CVR-001',
    model: 'CVR-001',
    type: 'protection',
    image_url: '/images/accessories/dust-cover.jpg',
    product_type: 'accessory',
    brand: 'BLP',
    voltage: 'N/A',
    frequency: 'N/A',
    spec: '60x40x50cm',
    spec_imperial: '23.6x15.7x19.7in',
    package_size: '30x20x5cm',
    package_size_imperial: '11.8x7.9x2in',
    net_weight: 0.3,
    net_weight_imperial: 0.66,
    gross_weight: 0.4,
    gross_weight_imperial: 0.88,
    box_quantity: 20,
    pallet_size: '120x80x100cm',
    pallet_size_imperial: '47.2x31.5x39.4in',
    pallet_quantity: 400,
    pallet_height: 100,
    pallet_height_imperial: 39.4,
    pallet_gross_weight: 160,
    pallet_gross_weight_imperial: 353,
    prices: {
      current: 19.99,
      original: 24.99,
      tiers: [
        { range: '1-9', price: 19.99 },
        { range: '10-49', price: 18.99 },
        { range: '50-99', price: 17.99 },
        { range: '100+', price: 16.99 }
      ]
    },
    inventory: {
      total: 300,
      eu: 100,
      na: 100,
      au: 50,
      cn: 50
    }
  }
];

export default accessoriesMock; 