/**
 * Mock数据统一管理
 * 提供整个应用程序的模拟数据导入导出功能
 */

// 导入所有可用的mock数据
import { mockMachines, mockAccessories, mockLevel2Accessories, mockLevel3Accessories, mockLevel4Accessories, mockLevel5Accessories, mockSpareParts } from '../../mock/machinesMock';
import { mockProducts } from './productsMock';
import { mockProductLines } from './productLinesMock';
import { mockUsers } from './usersMock';
import { mockOrders } from './ordersMock';
import { mockConsumables } from './consumablesMock';

// 导出所有可用的mock数据
export { 
  mockMachines, 
  mockAccessories, 
  mockLevel2Accessories, 
  mockLevel3Accessories, 
  mockLevel4Accessories, 
  mockLevel5Accessories,
  mockProducts,
  mockProductLines,
  mockUsers,
  mockOrders,
  mockConsumables,
  mockSpareParts
};

/**
 * 导出整个应用程序的模拟数据
 * 可以用于保存到文件或者API测试
 */
export const exportAllMockData = () => {
  return {
    machines: mockMachines,
    accessories: {
      level1: mockAccessories,
      level2: mockLevel2Accessories,
      level3: mockLevel3Accessories,
      level4: mockLevel4Accessories,
      level5: mockLevel5Accessories
    },
    products: mockProducts,
    productLines: mockProductLines,
    users: mockUsers,
    orders: mockOrders,
    consumables: mockConsumables,
    spareParts: mockSpareParts
  };
};

/**
 * 导入模拟数据
 * @param data 需要导入的数据对象
 */
export const importMockData = (data: any) => {
  // 实际实现中，这里会验证数据格式并更新各个mock数据模块
  // 由于模拟数据是常量，这里实际上并不会改变模拟数据
  // 在实际应用中，可以考虑使用状态管理库存储模拟数据，使其可变
  console.log('Importing mock data:', data);
  return true;
};

// 默认导出所有mock数据
export default {
  machines: mockMachines,
  accessories: {
    level1: mockAccessories,
    level2: mockLevel2Accessories,
    level3: mockLevel3Accessories,
    level4: mockLevel4Accessories,
    level5: mockLevel5Accessories
  },
  products: mockProducts,
  productLines: mockProductLines,
  users: mockUsers,
  orders: mockOrders,
  consumables: mockConsumables,
  spareParts: mockSpareParts,
  export: exportAllMockData,
  import: importMockData
}; 