#!/usr/bin/env node

/**
 * API切换功能演示脚本
 * 展示如何在Mock数据、SQL Mock数据和真实API之间切换
 */

console.log('🎯 BJT前端API切换功能演示');
console.log('=' .repeat(60));

console.log('\n📋 功能概述:');
console.log('─'.repeat(40));
console.log('✅ 支持三种数据源切换：');
console.log('   🌐 真实API (localhost:8080)');
console.log('   🗄️ SQL Mock数据 (基于数据库结构)');
console.log('   📁 传统Mock文件');

console.log('\n🔧 使用方法:');
console.log('─'.repeat(40));

console.log('\n1. 通过MockServiceStatus组件切换:');
console.log('   • 点击右上角Mock服务状态组件');
console.log('   • 展开后可看到三个切换按钮');
console.log('   • 点击对应按钮即可切换数据源');

console.log('\n2. 通过代码切换:');
console.log(`   import { switchDataSource } from '../config/mock-config';
   
   // 切换到真实API
   switchDataSource('real-api');
   
   // 切换到SQL Mock数据
   switchDataSource('sql-mock');
   
   // 切换到传统Mock文件
   switchDataSource('mock');`);

console.log('\n🌐 真实API配置:');
console.log('─'.repeat(40));
console.log('• API服务器地址: http://localhost:8080');
console.log('• 支持的端点:');
console.log('  - GET /api/machines');
console.log('  - GET /api/accessories');
console.log('  - GET /api/consumables');
console.log('  - GET /api/spare-parts');
console.log('  - GET /api/product-lines');
console.log('  - GET /api/shapes');
console.log('  - GET /api/materials');
console.log('  - GET /api/health (健康检查)');
console.log('  - GET /api/info (API信息)');

console.log('\n🔄 切换逻辑:');
console.log('─'.repeat(40));
console.log('• 优先级: 真实API > SQL Mock > 传统Mock');
console.log('• 真实API调用失败时自动回退到Mock数据');
console.log('• 所有切换操作都会在控制台输出日志');
console.log('• MockServiceStatus组件实时显示当前数据源');

console.log('\n📊 状态监控:');
console.log('─'.repeat(40));
console.log('• Mock服务状态组件显示:');
console.log('  - 🟢 当前数据源 (真实API/SQL Mock/Mock文件)');
console.log('  - 📊 数据统计 (表数、记录数)');
console.log('  - ⚙️ 配置信息 (环境、缓存、延迟)');
console.log('  - 🌐 API地址 (当使用真实API时)');

console.log('\n🎨 页面集成:');
console.log('─'.repeat(40));
console.log('已集成的页面:');
console.log('• ✅ 首页 (Home) - 产品线数据');
console.log('• ✅ 机器页面 (Machines) - 主机和配件数据');
console.log('• ✅ 备件页面 (SpareParts) - 备件数据');
console.log('• ✅ 耗材页面 (Consumables) - 耗材数据');

console.log('\n🚀 启动建议:');
console.log('─'.repeat(40));
console.log('1. 开发环境: 使用SQL Mock数据进行界面开发');
console.log('2. 测试环境: 使用真实API进行集成测试');
console.log('3. 生产环境: 默认使用真实API');

console.log('\n💡 故障排除:');
console.log('─'.repeat(40));
console.log('• 如果真实API无法连接:');
console.log('  - 检查localhost:8080是否运行');
console.log('  - 查看浏览器控制台的网络请求');
console.log('  - 系统会自动回退到Mock数据');
console.log('• 如果Mock数据有问题:');
console.log('  - 检查SQL数据文件是否正确加载');
console.log('  - 查看Mock服务状态组件的统计信息');

console.log('\n🎯 下一步操作:');
console.log('─'.repeat(40));
console.log('1. 启动前端应用: npm run dev (或 npm start)');
console.log('2. 打开浏览器查看Mock服务状态组件');
console.log('3. 尝试切换不同的数据源');
console.log('4. 观察页面数据的变化和控制台日志');

console.log('\n✨ 演示完成！');
console.log('=' .repeat(60)); 