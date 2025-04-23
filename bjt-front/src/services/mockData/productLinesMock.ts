import { ProductLine } from '../api';

// 产品线模拟数据
export const mockProductLines: ProductLine[] = [
  {
    id: 1,
    title_en: 'Air Cushioning System',
    title_cn: '气垫包装系统',
    description_en: 'Our Air Cushioning System provides superior protection for your products during shipping. Designed for efficiency and versatility, this system creates customized air cushions that perfectly protect your items.',
    description_cn: '我们的气垫包装系统为您的产品在运输过程中提供卓越的保护。该系统专为高效和多功能而设计，可以创建完美保护您物品的定制气垫。',
    subitem1_en: 'Air Cushion Machine & Accessory',
    subitem1_cn: '气垫机及配件',
    subitem2_en: 'Film options',
    subitem2_cn: '气垫膜选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: '/images/shop/product-line-air-cushion.jpg',
    status: 'publish',
    menu_order: 1
  },
  {
    id: 2,
    title_en: 'Paper Cushioning System',
    title_cn: '纸垫包装系统',
    description_en: 'Our Paper Cushioning System offers an environmentally friendly alternative for product protection. Using 100% recyclable materials, this system provides excellent cushioning while being kind to the environment.',
    description_cn: '我们的纸垫包装系统为产品保护提供环保替代方案。使用100%可回收材料，该系统提供卓越的缓冲保护，同时对环境友好。',
    subitem1_en: 'Paper Cushion Machine & Accessory',
    subitem1_cn: '纸垫机及配件',
    subitem2_en: 'Paper options',
    subitem2_cn: '纸张选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: '/images/shop/product-line-paper-cushion.jpg',
    status: 'publish',
    menu_order: 2
  },
  {
    id: 3,
    title_en: 'Water Activated Tape System',
    title_cn: '水胶带系统',
    description_en: 'Our Water Activated Tape System provides the strongest possible seal for your packages. The water activated adhesive creates a permanent bond with the carton, offering superior security and tamper-evidence.',
    description_cn: '我们的水胶带系统为您的包装提供最强大的密封。水激活的粘合剂与纸箱创建永久性粘合，提供卓越的安全性和防篡改证据。',
    subitem1_en: 'Water Activated Tape Machine',
    subitem1_cn: '水胶带机',
    subitem2_en: 'Tape options',
    subitem2_cn: '胶带选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: '/images/shop/product-line-water-tape.jpg',
    status: 'publish',
    menu_order: 3
  },
  {
    id: 4,
    title_en: 'Foam Packaging System',
    title_cn: '泡沫包装系统',
    description_en: 'Our Foam Packaging System delivers custom-fit protection for delicate and high-value items. The foam expands to conform perfectly to your product, creating a secure cushion that prevents damage during shipping.',
    description_cn: '我们的泡沫包装系统为精密和高价值物品提供定制保护。泡沫膨胀以完美贴合您的产品，创建一个安全缓冲，防止在运输过程中损坏。',
    subitem1_en: 'Foam Packaging Machine',
    subitem1_cn: '泡沫包装机',
    subitem2_en: 'Foam material options',
    subitem2_cn: '泡沫材料选择',
    subitem3_en: 'Spare parts',
    subitem3_cn: '备件',
    image_url: '/images/shop/product-line-foam.jpg',
    status: 'publish',
    menu_order: 4
  }
]; 