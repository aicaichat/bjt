/**
 * E2E测试全局清理
 * 在所有测试运行后执行一次
 */
async function globalTeardown() {
  console.log('🧹 开始BJT E2E测试全局清理...');
  
  // 清理临时文件
  // 重置环境变量
  delete process.env.VITE_DATA_SOURCE;
  delete process.env.VITE_DEBUG_LOGS;
  delete process.env.VITE_SHOW_MOCK_STATUS;
  
  console.log('✅ 测试环境清理完成');
  console.log('🎯 BJT E2E测试全局清理完成');
}

export default globalTeardown; 