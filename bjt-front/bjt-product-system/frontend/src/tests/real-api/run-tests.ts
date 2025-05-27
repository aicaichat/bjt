import { runRealMachinesPageTests } from './pages/machines-page.real-api.test';

async function runAllTests() {
  console.log('🚀 开始运行真实API测试...\n');

  // 运行机器页面测试
  console.log('📋 运行机器页面测试...');
  const machinesTestResults = await runRealMachinesPageTests();
  
  // 打印测试结果
  console.log('\n📊 测试结果汇总:');
  console.log('----------------------------------------');
  console.log(`总测试数: ${machinesTestResults.total}`);
  console.log(`通过: ${machinesTestResults.passed}`);
  console.log(`失败: ${machinesTestResults.failed}`);
  console.log(`跳过: ${machinesTestResults.skipped}`);
  console.log('----------------------------------------');

  // 打印详细测试结果
  console.log('\n📝 详细测试结果:');
  machinesTestResults.details.forEach(result => {
    const statusEmoji = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
    console.log(`${statusEmoji} ${result.test}`);
    if (result.error) {
      console.log(`   错误: ${result.error}`);
    }
    if (result.apiCall) {
      console.log(`   API调用: ${result.apiCall}`);
    }
    if (result.responseTime) {
      console.log(`   响应时间: ${result.responseTime}ms`);
    }
    if (result.statusCode) {
      console.log(`   状态码: ${result.statusCode}`);
    }
    console.log('---');
  });

  // 打印API指标
  console.log('\n📈 API性能指标:');
  console.log('----------------------------------------');
  console.log(`总API调用数: ${machinesTestResults.apiMetrics.totalCalls}`);
  console.log(`平均响应时间: ${machinesTestResults.apiMetrics.averageResponseTime.toFixed(2)}ms`);
  if (machinesTestResults.apiMetrics.slowestCall) {
    console.log(`最慢调用: ${machinesTestResults.apiMetrics.slowestCall.endpoint} (${machinesTestResults.apiMetrics.slowestCall.time}ms)`);
  }
  if (machinesTestResults.apiMetrics.fastestCall) {
    console.log(`最快调用: ${machinesTestResults.apiMetrics.fastestCall.endpoint} (${machinesTestResults.apiMetrics.fastestCall.time}ms)`);
  }
  console.log(`错误率: ${(machinesTestResults.apiMetrics.errorRate * 100).toFixed(2)}%`);
  console.log('----------------------------------------');
}

// 运行所有测试
runAllTests().catch(error => {
  console.error('❌ 测试运行出错:', error);
  process.exit(1);
}); 