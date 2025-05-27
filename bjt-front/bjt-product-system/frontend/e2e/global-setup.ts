import { FullConfig } from '@playwright/test';

/**
 * E2E测试全局设置
 * 在所有测试运行前执行一次
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始BJT E2E测试全局设置...');
  
  // 设置环境变量确保使用Mock数据
  process.env.VITE_DATA_SOURCE = 'sql-mock';
  process.env.VITE_DEBUG_LOGS = 'false';
  process.env.VITE_SHOW_MOCK_STATUS = 'true';
  
  console.log('✅ 测试环境配置完成:');
  console.log('   - 数据源: SQL Mock');
  console.log('   - 调试日志: 关闭');
  console.log('   - Mock状态显示: 开启');
  
  // 等待一小段时间确保配置生效
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('🎯 BJT E2E测试全局设置完成');
}

export default globalSetup; 