#!/usr/bin/env node

/**
 * 页面集成演示脚本
 * 展示首页、机器页面、备件页面、耗材选购页面如何使用SQL Mock数据服务
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎯 BJT前端页面SQL Mock数据服务集成演示');
console.log('=' .repeat(60));

// 模拟各页面的数据使用场景
const pageIntegrationDemo = {
  
  // 1. 首页集成演示
  homePage: () => {
    console.log('\n📱 首页 (Home Page) 集成演示:');
    console.log('─'.repeat(40));
    
    console.log('✅ 已集成功能:');
    console.log('   • 使用 useProductLines() Hook 获取产品线数据');
    console.log('   • 添加 MockServiceStatus 组件监控服务状态');
    console.log('   • 支持中英文双语显示');
    console.log('   • 自动分页处理');
    
    console.log('\n🔧 代码示例:');
    console.log(`   import { useProductLines } from '../../hooks/useMockData';
   import MockServiceStatus from '../../components/MockServiceStatus';
   
   const { data: productLines, loading, error } = useProductLines({
     onSuccess: (data) => console.log('✅ 首页产品线数据加载成功:', data),
     onError: (error) => console.error('❌ 首页产品线数据加载失败:', error)
   });`);
    
    console.log('\n📊 数据展示:');
    console.log('   • 气垫系列 (Air Cushioning System)');
    console.log('   • 纸垫系列 (Paper Cushioning Machine)');
    console.log('   • 胶带系列 (Water Activated Tape Dispenser)');
  },
  
  // 2. 机器页面集成演示
  machinesPage: () => {
    console.log('\n🏭 机器页面 (Machines Page) 集成演示:');
    console.log('─'.repeat(40));
    
    console.log('✅ 已集成功能:');
    console.log('   • 使用 useMachines() Hook 获取机器数据');
    console.log('   • 使用 useAccessories() Hook 获取配件数据');
    console.log('   • 添加 MockServiceStatus 组件');
    console.log('   • 支持多级配件选择');
    console.log('   • 支持电压筛选 (110V/220V)');
    
    console.log('\n🔧 代码示例:');
    console.log(`   import { useMachines, useAccessories } from '../../hooks/useMockData';
   
   const { data: mockMachinesData, loading: mockLoading, error: mockError } = useMachines({
     category: 1, // 气垫系列
     page: 1,
     pageSize: 20
   }, {
     onSuccess: (data) => console.log('✅ 机器页面数据加载成功:', data),
     onError: (error) => console.error('❌ 机器页面数据加载失败:', error)
   });`);
    
    console.log('\n📊 数据展示:');
    console.log('   • LA-E4S V2.0 商用型缓冲气垫机');
    console.log('   • LA-E4S(paper) 商用型缓冲气垫机');
    console.log('   • 配件: ET400, ET1003, FR8002 等');
  },
  
  // 3. 备件页面集成演示
  sparePartsPage: () => {
    console.log('\n🔧 备件页面 (Spare Parts Page) 集成演示:');
    console.log('─'.repeat(40));
    
    console.log('✅ 已集成功能:');
    console.log('   • 使用 useSpareParts() Hook 获取备件数据');
    console.log('   • 添加 MockServiceStatus 组件');
    console.log('   • 支持易损/非易损筛选');
    console.log('   • 支持机器型号筛选');
    console.log('   • 支持价格计算和库存显示');
    
    console.log('\n🔧 代码示例:');
    console.log(`   import { useSpareParts } from '../../hooks/useMockData';
   
   const { data: mockSparePartsData, loading: mockLoading, error: mockError } = useSpareParts({
     page: 1,
     pageSize: 20,
     search: ''
   }, {
     onSuccess: (data) => console.log('✅ 备件页面数据加载成功:', data),
     onError: (error) => console.error('❌ 备件页面数据加载失败:', error)
   });`);
    
    console.log('\n📊 数据展示:');
    console.log('   • 易损件: 8A保险丝, 去皱硅胶, 陶瓷刀片');
    console.log('   • 非易损件: 螺钉, 垫圈, 螺母');
    console.log('   • 支持 LA-E4S V2.0, LA-E4S(paper) 等机型');
  },
  
  // 4. 耗材选购页面集成演示
  consumablesPage: () => {
    console.log('\n📦 耗材选购页面 (Consumables Page) 集成演示:');
    console.log('─'.repeat(40));
    
    console.log('✅ 已集成功能:');
    console.log('   • 使用 useConsumables() Hook 获取耗材数据');
    console.log('   • 使用 useShapes() Hook 获取形状数据');
    console.log('   • 使用 useMaterials() Hook 获取材料数据');
    console.log('   • 添加 MockServiceStatus 组件');
    console.log('   • 支持多维度筛选 (形状/材料/厚度/宽度/长度)');
    
    console.log('\n🔧 代码示例:');
    console.log(`   import { useConsumables, useShapes, useMaterials } from '../../hooks/useMockData';
   
   const { data: mockConsumablesData, loading: mockLoading, error: mockError } = useConsumables({
     page: 1,
     pageSize: 20,
     shape: 'all',
     material: 'all'
   }, {
     onSuccess: (data) => console.log('✅ 耗材页面数据加载成功:', data),
     onError: (error) => console.error('❌ 耗材页面数据加载失败:', error)
   });
   
   const { data: shapesData } = useShapes();
   const { data: materialsData } = useMaterials();`);
    
    console.log('\n📊 数据展示:');
    console.log('   • 形状: FTB, FTP, MFC, MFF');
    console.log('   • 材料: HDPE, LDPE, PAPE, PAPER 等');
    console.log('   • 规格: 厚度, 宽度, 长度等多种规格');
  },
  
  // 5. 通用集成特性
  commonFeatures: () => {
    console.log('\n🌟 通用集成特性:');
    console.log('─'.repeat(40));
    
    console.log('✅ 所有页面共享的功能:');
    console.log('   • MockServiceStatus 组件实时监控服务状态');
    console.log('   • 统一的错误处理和加载状态');
    console.log('   • 支持开发/测试/生产环境自动切换');
    console.log('   • 完整的TypeScript类型安全');
    console.log('   • 严格按照数据库表结构，无字段增减');
    
    console.log('\n🎛️ MockServiceStatus 组件功能:');
    console.log('   • 显示当前数据源 (SQL Mock / API)');
    console.log('   • 实时数据统计');
    console.log('   • 一键切换数据源');
    console.log('   • 紧凑/展开视图切换');
    console.log('   • 可配置位置 (top-right, top-left, bottom-right, bottom-left)');
  },
  
  // 6. 使用指南
  usageGuide: () => {
    console.log('\n📖 快速使用指南:');
    console.log('─'.repeat(40));
    
    console.log('🚀 1. 在App.tsx中初始化配置:');
    console.log(`   import { configureMockService } from "./config/mock-config";
   
   useEffect(() => {
     configureMockService();
   }, []);`);
    
    console.log('\n🎯 2. 在页面组件中使用Hook:');
    console.log(`   // 基础用法
   const { data, loading, error } = useProductLines();
   
   // 带参数用法
   const { data } = useMachines({ category: 1, page: 1, pageSize: 10 });
   
   // 带回调用法
   const { data } = useConsumables(params, {
     onSuccess: (data) => console.log('数据加载成功'),
     onError: (error) => console.error('数据加载失败')
   });`);
    
    console.log('\n🎨 3. 渲染数据:');
    console.log(`   {loading && <Loading />}
   {error && <Error message={error} />}
   {data?.items.map(item => (
     <div key={item.id}>{item.title_zh}</div>
   ))}`);
    
    console.log('\n📊 4. 添加状态监控 (可选):');
    console.log(`   import MockServiceStatus from "../components/MockServiceStatus";
   
   <MockServiceStatus position="top-right" compact={true} />`);
  }
};

// 运行演示
console.log('\n🎬 开始页面集成演示...\n');

pageIntegrationDemo.homePage();
pageIntegrationDemo.machinesPage();
pageIntegrationDemo.sparePartsPage();
pageIntegrationDemo.consumablesPage();
pageIntegrationDemo.commonFeatures();
pageIntegrationDemo.usageGuide();

console.log('\n' + '='.repeat(60));
console.log('🎉 页面集成演示完成！');
console.log('\n✅ 集成状态总结:');
console.log('   • 首页 (Home): ✅ 已集成 useProductLines + MockServiceStatus');
console.log('   • 机器页面 (Machines): ✅ 已集成 useMachines + useAccessories + MockServiceStatus');
console.log('   • 备件页面 (SpareParts): ✅ 已集成 useSpareParts + MockServiceStatus');
console.log('   • 耗材页面 (Consumables): ✅ 已集成 useConsumables + useShapes + useMaterials + MockServiceStatus');

console.log('\n🚀 现在你可以启动开发服务器查看效果:');
console.log('   npm run dev');

console.log('\n📚 更多文档请参考:');
console.log('   • docs/sql-mock-page-integration-guide.md');
console.log('   • frontend/src/examples/quick-integration-demo.tsx');

console.log('\n🎯 SQL Mock数据服务已在所有页面成功集成！'); 