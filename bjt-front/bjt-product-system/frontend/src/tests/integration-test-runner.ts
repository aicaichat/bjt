/**
 * BJT前端集成测试运行器
 * 统一管理和运行所有页面的集成测试
 */

import { runHomePageTests } from './pages/home-page.integration.test';
import { runMachinesPageTests } from './pages/machines-page.integration.test';

// 测试结果接口
interface TestResult {
  page: string;
  total: number;
  passed: number;
  failed: number;
  details: Array<{ test: string; status: 'pass' | 'fail'; error?: string }>;
  duration: number;
}

// 集成测试运行器类
export class IntegrationTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;
  private endTime: number = 0;

  async runAllTests(): Promise<void> {
    console.log('🚀 开始运行BJT前端集成测试套件...\n');
    this.startTime = Date.now();

    // 要测试的页面列表
    const testSuites = [
      { name: 'HomePage', runner: runHomePageTests },
      { name: 'MachinesPage', runner: runMachinesPageTests },
      // 未来可以添加更多页面测试
      // { name: 'LoginPage', runner: runLoginPageTests },
      // { name: 'CartPage', runner: runCartPageTests },
    ];

    // 依次运行各页面测试
    for (const suite of testSuites) {
      await this.runPageTest(suite.name, suite.runner);
    }

    this.endTime = Date.now();
    this.generateFinalReport();
  }

  private async runPageTest(pageName: string, testRunner: () => Promise<any>): Promise<void> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 运行 ${pageName} 集成测试`);
    console.log(`${'='.repeat(60)}`);

    const pageStartTime = Date.now();
    
    try {
      const result = await testRunner();
      const pageEndTime = Date.now();
      
      this.results.push({
        page: pageName,
        total: result.total,
        passed: result.passed,
        failed: result.failed,
        details: result.details,
        duration: pageEndTime - pageStartTime
      });

      console.log(`\n✅ ${pageName} 测试完成`);
      console.log(`   通过: ${result.passed}/${result.total}`);
      console.log(`   耗时: ${pageEndTime - pageStartTime}ms`);
      
    } catch (error) {
      console.error(`\n❌ ${pageName} 测试运行失败:`, error);
      
      this.results.push({
        page: pageName,
        total: 0,
        passed: 0,
        failed: 1,
        details: [{ test: 'testRunner', status: 'fail', error: (error as Error).message }],
        duration: Date.now() - pageStartTime
      });
    }
  }

  private generateFinalReport(): void {
    const totalDuration = this.endTime - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 BJT前端集成测试最终报告');
    console.log('='.repeat(80));
    
    // 总体统计
    const totalTests = this.results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0';
    
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过: ${totalPassed} ✅`);
    console.log(`失败: ${totalFailed} ❌`);
    console.log(`成功率: ${successRate}%`);
    console.log(`总耗时: ${totalDuration}ms`);
    
    // 各页面详情
    console.log('\n📋 各页面测试详情:');
    this.results.forEach(result => {
      const pageSuccessRate = result.total > 0 ? 
        ((result.passed / result.total) * 100).toFixed(1) : '0';
      
      console.log(`\n🔸 ${result.page}:`);
      console.log(`   测试数: ${result.total}`);
      console.log(`   通过: ${result.passed}`);
      console.log(`   失败: ${result.failed}`);
      console.log(`   成功率: ${pageSuccessRate}%`);
      console.log(`   耗时: ${result.duration}ms`);
      
      if (result.failed > 0) {
        console.log(`   失败项目:`);
        result.details
          .filter(d => d.status === 'fail')
          .forEach(d => {
            console.log(`     - ${d.test}: ${d.error}`);
          });
      }
    });
    
    // 优化建议
    console.log('\n🎯 整体优化建议:');
    
    if (totalFailed === 0) {
      console.log('  ✨ 所有集成测试通过！系统集成良好');
      console.log('  📈 建议关注性能优化和用户体验提升');
      console.log('  🔧 考虑添加更多边界情况测试');
    } else {
      console.log('  🔧 需要修复的问题:');
      
      // 统计失败最多的测试类型
      const failureStats = this.analyzeFailures();
      failureStats.forEach(stat => {
        console.log(`     - ${stat.type}: ${stat.count} 个失败`);
      });
      
      console.log('\n  📋 修复优先级建议:');
      console.log('     1. 错误处理 - 确保系统稳定性');
      console.log('     2. API集成 - 保证数据正确性');
      console.log('     3. 用户交互 - 提升用户体验');
      console.log('     4. 性能优化 - 提高响应速度');
    }
    
    // 代码质量评估
    this.generateCodeQualityAssessment();
  }

  private analyzeFailures(): Array<{ type: string; count: number }> {
    const failureMap: Record<string, number> = {};
    
    this.results.forEach(result => {
      result.details
        .filter(d => d.status === 'fail')
        .forEach(d => {
          // 简单的失败类型分类
          if (d.test.includes('Error') || d.test.includes('error')) {
            failureMap['错误处理'] = (failureMap['错误处理'] || 0) + 1;
          } else if (d.test.includes('API') || d.test.includes('Data')) {
            failureMap['API集成'] = (failureMap['API集成'] || 0) + 1;
          } else if (d.test.includes('UI') || d.test.includes('Component')) {
            failureMap['用户界面'] = (failureMap['用户界面'] || 0) + 1;
          } else if (d.test.includes('Performance')) {
            failureMap['性能'] = (failureMap['性能'] || 0) + 1;
          } else {
            failureMap['其他'] = (failureMap['其他'] || 0) + 1;
          }
        });
    });
    
    return Object.entries(failureMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private generateCodeQualityAssessment(): void {
    console.log('\n📊 代码质量评估:');
    
    const totalTests = this.results.reduce((sum, r) => sum + r.total, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    
    // 质量指标计算
    const qualityScore = this.calculateQualityScore(totalPassed, totalTests, avgDuration);
    
    console.log(`  质量评分: ${qualityScore.score}/100`);
    console.log(`  评级: ${qualityScore.grade}`);
    console.log(`  测试覆盖度: ${qualityScore.coverage}%`);
    console.log(`  性能指标: ${qualityScore.performance}`);
    
    console.log('\n🎖️ 质量认证:');
    qualityScore.certifications.forEach(cert => {
      console.log(`  ${cert.status} ${cert.name}: ${cert.description}`);
    });
  }

  private calculateQualityScore(passed: number, total: number, avgDuration: number) {
    const testReliability = total > 0 ? (passed / total) * 100 : 0;
    const performanceScore = avgDuration < 1000 ? 100 : Math.max(0, 100 - (avgDuration - 1000) / 100);
    const coverageScore = total >= 10 ? 100 : (total / 10) * 100; // 假设10个测试为满分
    
    const overallScore = (testReliability * 0.5 + performanceScore * 0.3 + coverageScore * 0.2);
    
    let grade = 'F';
    if (overallScore >= 90) grade = 'A+';
    else if (overallScore >= 80) grade = 'A';
    else if (overallScore >= 70) grade = 'B';
    else if (overallScore >= 60) grade = 'C';
    else if (overallScore >= 50) grade = 'D';
    
    const certifications = [
      {
        name: '稳定性认证',
        status: testReliability >= 95 ? '✅' : testReliability >= 85 ? '⚠️' : '❌',
        description: testReliability >= 95 ? '系统非常稳定' : 
                    testReliability >= 85 ? '系统基本稳定' : '需要改进稳定性'
      },
      {
        name: '性能认证',
        status: performanceScore >= 90 ? '✅' : performanceScore >= 70 ? '⚠️' : '❌',
        description: performanceScore >= 90 ? '性能优秀' : 
                    performanceScore >= 70 ? '性能良好' : '需要性能优化'
      },
      {
        name: '集成认证',
        status: passed >= total * 0.9 ? '✅' : passed >= total * 0.7 ? '⚠️' : '❌',
        description: passed >= total * 0.9 ? '集成完善' : 
                    passed >= total * 0.7 ? '集成良好' : '需要改进集成'
      }
    ];
    
    return {
      score: Math.round(overallScore),
      grade,
      coverage: Math.round(coverageScore),
      performance: avgDuration < 500 ? '优秀' : avgDuration < 1000 ? '良好' : '需改进',
      certifications
    };
  }

  // 生成详细的JSON报告
  generateJSONReport(): string {
    const report = {
      summary: {
        totalTests: this.results.reduce((sum, r) => sum + r.total, 0),
        totalPassed: this.results.reduce((sum, r) => sum + r.passed, 0),
        totalFailed: this.results.reduce((sum, r) => sum + r.failed, 0),
        successRate: this.results.reduce((sum, r) => sum + r.total, 0) > 0 ? 
          ((this.results.reduce((sum, r) => sum + r.passed, 0) / 
            this.results.reduce((sum, r) => sum + r.total, 0)) * 100).toFixed(1) : '0',
        duration: this.endTime - this.startTime,
        timestamp: new Date().toISOString()
      },
      pages: this.results,
      recommendations: this.generateRecommendations()
    };
    
    return JSON.stringify(report, null, 2);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    
    if (totalFailed === 0) {
      recommendations.push('所有测试通过，系统集成良好');
      recommendations.push('建议添加更多边界情况测试');
      recommendations.push('考虑增加性能压力测试');
    } else {
      recommendations.push('修复失败的测试用例');
      recommendations.push('加强错误处理机制');
      recommendations.push('完善API集成测试');
    }
    
    // 基于平均执行时间的建议
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    if (avgDuration > 2000) {
      recommendations.push('优化测试执行性能，考虑并行执行');
    }
    
    return recommendations;
  }

  // 获取测试结果
  getResults(): TestResult[] {
    return this.results;
  }
}

// 主要导出函数
export async function runIntegrationTests(): Promise<IntegrationTestRunner> {
  const runner = new IntegrationTestRunner();
  await runner.runAllTests();
  return runner;
}

// 如果直接运行此文件
if (typeof window === 'undefined') {
  runIntegrationTests()
    .then(runner => {
      // 可以保存报告到文件
      const jsonReport = runner.generateJSONReport();
      console.log('\n📄 JSON报告已生成，可保存到文件中');
      // fs.writeFileSync('test-report.json', jsonReport); // 需要在Node.js环境中
    })
    .catch(console.error);
} 