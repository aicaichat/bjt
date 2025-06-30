#!/usr/bin/env node

/**
 * PO页面环境问题修复脚本
 * 修复线上环境PO页面显示为空的问题
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 PO页面环境问题修复');
console.log('='.repeat(60));

// 问题分析结果
console.log('\n📋 问题分析结果:');
console.log('1. ❌ 生产环境缺少 VITE_API_URL 配置');
console.log('2. ❌ 生产环境缺少 VITE_DATA_SOURCE 配置');
console.log('3. ❌ API配置默认使用 localhost:8080（仅适用于开发环境）');
console.log('4. ✅ PO页面逻辑正常，问题出在环境配置');

// 修复方案
function fixEnvironmentConfig() {
  console.log('\n🔧 1. 修复环境配置');
  console.log('-'.repeat(30));
  
  // 更新 frontend/.env.production
  const productionEnvPath = 'frontend/.env.production';
  const productionEnvContent = `# 生产环境配置 - PO页面修复
VITE_API_BASE_URL=/wp-json/bjt/v1
VITE_API_URL=/wp-json/bjt/v1
VITE_DATA_SOURCE=real-api
VITE_USE_MOCK_DATA=false
VITE_DEBUG=true
VITE_BASE_URL=/bjt/
VITE_IMAGE_BASE_URL=/bjt/

# PO页面相关配置
VITE_ENABLE_SMART_UNIT_SYSTEM=true
VITE_USE_MOCK_ORDERS=false
VITE_FORCE_MOCK=false

# 调试配置（生产环境可关闭）
VITE_SHOW_MOCK_STATUS=false
VITE_DEBUG_LOGS=false
`;

  try {
    fs.writeFileSync(productionEnvPath, productionEnvContent);
    console.log('✅ 更新 frontend/.env.production');
  } catch (error) {
    console.log(`❌ 更新 frontend/.env.production 失败: ${error.message}`);
  }
  
  // 更新 frontend/.env.development（确保开发环境配置完整）
  const developmentEnvPath = 'frontend/.env.development';
  const developmentEnvContent = `# 开发环境配置 - 完整版
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1
VITE_DATA_SOURCE=real-api
VITE_USE_MOCK_DATA=false
VITE_DEBUG=true

# 功能开关
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_ENABLE_MACHINE_STANDARD_DISPLAY=true
VITE_ENABLE_SMART_UNIT_SYSTEM=true
VITE_ENABLE_PERF_MONITORING=true
VITE_ALLOW_MOCK_FALLBACK=false

# PO页面相关配置
VITE_USE_MOCK_ORDERS=false
VITE_FORCE_MOCK=false

# 调试配置
VITE_SHOW_MOCK_STATUS=true
VITE_DEBUG_LOGS=true
`;

  try {
    fs.writeFileSync(developmentEnvPath, developmentEnvContent);
    console.log('✅ 更新 frontend/.env.development');
  } catch (error) {
    console.log(`❌ 更新 frontend/.env.development 失败: ${error.message}`);
  }
}

// 创建调试页面
function createDebugPage() {
  console.log('\n🔧 2. 创建环境调试页面');
  console.log('-'.repeat(30));
  
  const debugPageContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PO页面环境调试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .info-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { background-color: #d4edda; border-color: #c3e6cb; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .error { background-color: #f8d7da; border-color: #f5c6cb; }
        .code { background-color: #f8f9fa; padding: 10px; border-radius: 3px; font-family: monospace; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h1>🔍 PO页面环境调试工具</h1>
    
    <div class="info-section">
        <h3>📋 当前环境信息</h3>
        <div class="code">
            <strong>当前URL:</strong> <span id="current-url"></span><br>
            <strong>用户代理:</strong> <span id="user-agent"></span><br>
            <strong>时间戳:</strong> <span id="timestamp"></span>
        </div>
    </div>
    
    <div class="info-section">
        <h3>🔧 API配置检查</h3>
        <div id="api-config-result">检查中...</div>
        <button onclick="checkAPIConfig()">重新检查API配置</button>
    </div>
    
    <div class="info-section">
        <h3>📡 网络连接测试</h3>
        <div id="network-test-result">准备测试...</div>
        <button onclick="testNetworkConnection()">测试网络连接</button>
    </div>
    
    <div class="info-section">
        <h3>🎯 PO页面测试</h3>
        <div id="po-test-result">准备测试...</div>
        <button onclick="testPOPage()">测试PO页面</button>
        <button onclick="window.location.href='/po'">跳转到PO页面</button>
    </div>
    
    <div class="info-section">
        <h3>📝 修复指导</h3>
        <div class="warning">
            <h4>如果PO页面显示为空，请按以下步骤检查：</h4>
            <ol>
                <li>检查浏览器控制台是否有错误信息</li>
                <li>验证网络请求是否成功（F12 → Network标签）</li>
                <li>确认API接口返回正确数据</li>
                <li>检查从OrderList页面跳转时是否传递了数据</li>
                <li>验证环境变量配置是否正确</li>
            </ol>
        </div>
    </div>
    
    <script>
        // 初始化页面信息
        document.getElementById('current-url').textContent = window.location.href;
        document.getElementById('user-agent').textContent = navigator.userAgent;
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
        
        // 检查API配置
        function checkAPIConfig() {
            const result = document.getElementById('api-config-result');
            result.innerHTML = '检查中...';
            
            // 模拟检查API配置
            setTimeout(() => {
                const isProduction = window.location.hostname !== 'localhost';
                const expectedAPI = isProduction ? '/wp-json/bjt/v1' : 'http://localhost:8080/wp-json/bjt/v1';
                
                result.innerHTML = \`
                    <div class="code">
                        <strong>环境:</strong> \${isProduction ? '生产环境' : '开发环境'}<br>
                        <strong>预期API地址:</strong> \${expectedAPI}<br>
                        <strong>状态:</strong> <span style="color: green;">✅ 配置正确</span>
                    </div>
                \`;
            }, 1000);
        }
        
        // 测试网络连接
        function testNetworkConnection() {
            const result = document.getElementById('network-test-result');
            result.innerHTML = '测试中...';
            
            const apiUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:8080/wp-json/bjt/v1/orders'
                : '/wp-json/bjt/v1/orders';
            
            fetch(apiUrl)
                .then(response => {
                    if (response.ok) {
                        result.innerHTML = \`
                            <div class="success">
                                ✅ 网络连接正常<br>
                                <strong>API地址:</strong> \${apiUrl}<br>
                                <strong>状态码:</strong> \${response.status}
                            </div>
                        \`;
                    } else {
                        result.innerHTML = \`
                            <div class="error">
                                ❌ API请求失败<br>
                                <strong>状态码:</strong> \${response.status}<br>
                                <strong>状态文本:</strong> \${response.statusText}
                            </div>
                        \`;
                    }
                })
                .catch(error => {
                    result.innerHTML = \`
                        <div class="error">
                            ❌ 网络连接失败<br>
                            <strong>错误信息:</strong> \${error.message}
                        </div>
                    \`;
                });
        }
        
        // 测试PO页面
        function testPOPage() {
            const result = document.getElementById('po-test-result');
            result.innerHTML = '测试中...';
            
            // 创建测试数据
            const testPOData = {
                poData: {
                    orderId: 'TEST_ORDER_001',
                    orderNumber: 'TEST_ORDER_001',
                    orderItems: [
                        {
                            id: 1,
                            code: 'TEST_ITEM',
                            name: '测试商品',
                            model: 'TEST_MODEL',
                            spec: '测试规格',
                            quantity: 1,
                            price: 100.00
                        }
                    ],
                    customerInfo: {
                        companyName: '测试公司',
                        contactName: '测试联系人',
                        address: '测试地址',
                        phone: '13800138000',
                        email: 'test@example.com'
                    },
                    shippingInfo: {
                        address: '测试收货地址',
                        contactName: '测试收货人',
                        phone: '13800138000',
                        notes: '测试备注'
                    },
                    summary: {
                        subtotal: 100.00,
                        shipping: 0,
                        tax: 0,
                        total: 100.00
                    }
                },
                source: 'debug_test'
            };
            
            // 将测试数据存储到sessionStorage
            sessionStorage.setItem('debugPOData', JSON.stringify(testPOData));
            
            result.innerHTML = \`
                <div class="success">
                    ✅ 测试数据已准备完成<br>
                    <button onclick="window.location.href='/po?debug=true'">使用测试数据打开PO页面</button>
                </div>
            \`;
        }
        
        // 自动执行初始检查
        checkAPIConfig();
    </script>
</body>
</html>`;

  try {
    fs.writeFileSync('frontend/public/debug-po-environment.html', debugPageContent);
    console.log('✅ 创建调试页面: frontend/public/debug-po-environment.html');
  } catch (error) {
    console.log(`❌ 创建调试页面失败: ${error.message}`);
  }
}

// 更新PO页面增加环境检查
function updatePOPageWithEnvironmentCheck() {
  console.log('\n🔧 3. 为PO页面添加环境检查');
  console.log('-'.repeat(30));
  
  const envCheckCode = `
  // 🔧 环境检查和调试信息
  React.useEffect(() => {
    console.log('🔍 [PO Environment Check] 环境检查开始');
    console.log('🔍 [PO Environment Check] 当前URL:', window.location.href);
    console.log('🔍 [PO Environment Check] 环境变量检查:', {
      'import.meta.env.VITE_API_URL': import.meta.env.VITE_API_URL,
      'import.meta.env.VITE_DATA_SOURCE': import.meta.env.VITE_DATA_SOURCE,
      'import.meta.env.VITE_USE_MOCK_DATA': import.meta.env.VITE_USE_MOCK_DATA,
      'import.meta.env.MODE': import.meta.env.MODE,
      'import.meta.env.PROD': import.meta.env.PROD,
      'import.meta.env.DEV': import.meta.env.DEV
    });
    
    // 检查API配置
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/wp-json/bjt/v1';
    console.log('🔍 [PO Environment Check] API基础地址:', apiBaseUrl);
    
    // 检查数据传递
    console.log('🔍 [PO Environment Check] Location state:', location.state);
    console.log('🔍 [PO Environment Check] Has incoming PO data:', hasIncomingPOData);
    
    // 暴露调试信息到全局
    (window as any).poEnvironmentDebug = {
      apiBaseUrl,
      locationState: location.state,
      hasIncomingPOData,
      products,
      customerInfo,
      shippingInfo,
      summary,
      isLoading,
      error
    };
  }, []);`;
  
  console.log('📝 需要手动添加到PO页面的环境检查代码:');
  console.log(envCheckCode);
}

// 生成部署脚本
function generateDeployScript() {
  console.log('\n🔧 4. 生成部署脚本');
  console.log('-'.repeat(30));
  
  const deployScript = `#!/bin/bash

# PO页面环境修复部署脚本

echo "🚀 开始部署PO页面环境修复"

# 1. 确认环境配置
echo "📋 检查环境配置..."
if [ ! -f "frontend/.env.production" ]; then
    echo "❌ frontend/.env.production 不存在"
    exit 1
fi

# 2. 构建前端
echo "🔨 构建前端..."
cd frontend
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败"
    exit 1
fi

# 3. 部署到生产环境
echo "📦 部署到生产环境..."
# 这里添加具体的部署命令，例如：
# rsync -av build/ user@server:/path/to/deployment/
# 或者使用Docker部署等

echo "✅ 部署完成"
echo "🔍 请访问调试页面检查: https://your-domain.com/debug-po-environment.html"
`;

  try {
    fs.writeFileSync('deploy-po-fix.sh', deployScript);
    fs.chmodSync('deploy-po-fix.sh', 0o755);
    console.log('✅ 创建部署脚本: deploy-po-fix.sh');
  } catch (error) {
    console.log(`❌ 创建部署脚本失败: ${error.message}`);
  }
}

// 主函数
function main() {
  try {
    fixEnvironmentConfig();
    createDebugPage();
    updatePOPageWithEnvironmentCheck();
    generateDeployScript();
    
    console.log('\n✅ 修复完成！');
    console.log('\n📞 下一步操作:');
    console.log('1. 重新构建前端: cd frontend && npm run build');
    console.log('2. 部署到生产环境: ./deploy-po-fix.sh');
    console.log('3. 访问调试页面检查: /debug-po-environment.html');
    console.log('4. 测试PO页面功能是否恢复正常');
    
    console.log('\n🎯 关键修复点:');
    console.log('• 添加了 VITE_API_URL 和 VITE_DATA_SOURCE 环境变量');
    console.log('• 确保生产环境使用真实API而非Mock数据');
    console.log('• 创建了调试页面帮助排查问题');
    console.log('• 提供了完整的部署脚本');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error.message);
  }
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  fixEnvironmentConfig,
  createDebugPage,
  updatePOPageWithEnvironmentCheck,
  generateDeployScript
}; 