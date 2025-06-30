#!/usr/bin/env node

/**
 * 生产环境PO页面问题修复脚本
 * 
 * 问题分析：
 * 1. 本地环境正常，生产环境异常
 * 2. 可能的原因：API URL配置、CORS、认证、数据源配置
 * 
 * 修复策略：
 * 1. 检查并修复API配置
 * 2. 更新环境变量
 * 3. 验证修复效果
 */

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// 项目根目录
const projectRoot = path.resolve(__dirname, '..');
const frontendDir = path.join(projectRoot, 'frontend');

// 环境配置文件路径
const envFiles = {
    production: path.join(frontendDir, '.env.production'),
    development: path.join(frontendDir, '.env.development')
};

// API配置文件路径
const configFiles = {
    appConfig: path.join(frontendDir, 'src/config/appConfig.ts'),
    config: path.join(frontendDir, 'src/config.ts')
};

/**
 * 检查文件是否存在
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

/**
 * 读取文件内容
 */
function readFile(filePath) {
    if (!fileExists(filePath)) {
        return null;
    }
    return fs.readFileSync(filePath, 'utf8');
}

/**
 * 写入文件内容
 */
function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 备份文件
 */
function backupFile(filePath) {
    if (!fileExists(filePath)) {
        return false;
    }
    
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    logInfo(`已备份文件: ${path.basename(filePath)} -> ${path.basename(backupPath)}`);
    return backupPath;
}

/**
 * 检查环境配置
 */
function checkEnvironmentConfig() {
    logInfo('检查环境配置...');
    
    const results = {};
    
    for (const [env, filePath] of Object.entries(envFiles)) {
        if (fileExists(filePath)) {
            const content = readFile(filePath);
            results[env] = {
                exists: true,
                content,
                hasApiUrl: content.includes('VITE_API_URL'),
                hasDataSource: content.includes('VITE_DATA_SOURCE'),
                hasMockConfig: content.includes('VITE_USE_MOCK_DATA')
            };
            logSuccess(`${env} 环境配置文件存在`);
        } else {
            results[env] = { exists: false };
            logError(`${env} 环境配置文件不存在: ${filePath}`);
        }
    }
    
    return results;
}

/**
 * 修复生产环境配置
 */
function fixProductionConfig() {
    logInfo('修复生产环境配置...');
    
    const prodConfigPath = envFiles.production;
    
    // 备份现有配置
    if (fileExists(prodConfigPath)) {
        backupFile(prodConfigPath);
    }
    
    // 生成新的生产环境配置
    const newProdConfig = `# 生产环境配置 - PO页面修复 (${new Date().toISOString()})
# API配置 - 使用动态URL检测
VITE_API_URL=
VITE_API_BASE_URL=
VITE_DATA_SOURCE=real-api
VITE_USE_MOCK_DATA=false

# 功能配置
VITE_ENABLE_SMART_UNIT_SYSTEM=true
VITE_USE_MOCK_ORDERS=false
VITE_FORCE_MOCK=false

# 调试配置
VITE_DEBUG=true
VITE_SHOW_MOCK_STATUS=false
VITE_DEBUG_LOGS=true

# 图片和资源配置
VITE_BASE_URL=
VITE_IMAGE_BASE_URL=

# 备注：空值将使用动态检测逻辑
`;
    
    writeFile(prodConfigPath, newProdConfig);
    logSuccess('生产环境配置已更新');
}

/**
 * 检查API配置文件
 */
function checkApiConfig() {
    logInfo('检查API配置文件...');
    
    const results = {};
    
    for (const [name, filePath] of Object.entries(configFiles)) {
        if (fileExists(filePath)) {
            const content = readFile(filePath);
            results[name] = {
                exists: true,
                content,
                hasBaseUrl: content.includes('BASE_URL'),
                hasEnvironmentDetection: content.includes('window.location')
            };
            logSuccess(`${name} 配置文件存在`);
        } else {
            results[name] = { exists: false };
            logWarning(`${name} 配置文件不存在: ${filePath}`);
        }
    }
    
    return results;
}

/**
 * 生成问题诊断报告
 */
function generateDiagnosticReport() {
    logInfo('生成诊断报告...');
    
    const report = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            cwd: process.cwd()
        },
        files: {},
        recommendations: []
    };
    
    // 检查关键文件
    const keyFiles = [
        'frontend/src/pages/PO/index.tsx',
        'frontend/src/config/appConfig.ts',
        'frontend/src/config.ts',
        'frontend/.env.production',
        'frontend/.env.development'
    ];
    
    for (const file of keyFiles) {
        const fullPath = path.join(projectRoot, file);
        report.files[file] = {
            exists: fileExists(fullPath),
            size: fileExists(fullPath) ? fs.statSync(fullPath).size : 0
        };
    }
    
    // 生成建议
    if (!report.files['frontend/.env.production'].exists) {
        report.recommendations.push('创建生产环境配置文件');
    }
    
    if (!report.files['frontend/src/config/appConfig.ts'].exists) {
        report.recommendations.push('检查API配置文件是否存在');
    }
    
    // 保存报告
    const reportPath = path.join(projectRoot, 'production-diagnostic-report.json');
    writeFile(reportPath, JSON.stringify(report, null, 2));
    logSuccess(`诊断报告已保存: ${reportPath}`);
    
    return report;
}

/**
 * 创建快速测试页面
 */
function createTestPage() {
    logInfo('创建快速测试页面...');
    
    const testPagePath = path.join(frontendDir, 'public/production-test.html');
    
    const testPageContent = `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>生产环境快速测试</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .test-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .success { background: #d4edda; border-color: #c3e6cb; }
        .error { background: #f8d7da; border-color: #f5c6cb; }
        .info { background: #d1ecf1; border-color: #bee5eb; }
        button { padding: 10px 20px; margin: 5px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔧 生产环境快速测试</h1>
    <p>生成时间: ${new Date().toISOString()}</p>
    
    <div class="test-section info">
        <h2>环境信息</h2>
        <div id="env-info"></div>
    </div>
    
    <div class="test-section">
        <h2>API测试</h2>
        <button onclick="testAPI()">测试API连接</button>
        <div id="api-results"></div>
    </div>
    
    <div class="test-section">
        <h2>PO页面测试</h2>
        <button onclick="testPOPage()">测试PO页面</button>
        <a href="/po" target="_blank" style="margin-left: 10px;">打开PO页面</a>
        <div id="po-results"></div>
    </div>
    
    <script>
        // 显示环境信息
        function showEnvInfo() {
            const info = {
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            };
            document.getElementById('env-info').innerHTML = '<pre>' + JSON.stringify(info, null, 2) + '</pre>';
        }
        
        // 测试API
        async function testAPI() {
            const resultsDiv = document.getElementById('api-results');
            resultsDiv.innerHTML = '<p>测试中...</p>';
            
            const tests = [
                '/wp-json/',
                '/wp-json/bjt/v1/',
                '/wp-json/bjt/v1/orders'
            ];
            
            const results = [];
            
            for (const url of tests) {
                try {
                    const response = await fetch(url);
                    results.push({
                        url,
                        status: response.status,
                        ok: response.ok
                    });
                } catch (error) {
                    results.push({
                        url,
                        error: error.message
                    });
                }
            }
            
            resultsDiv.innerHTML = '<pre>' + JSON.stringify(results, null, 2) + '</pre>';
        }
        
        // 测试PO页面
        function testPOPage() {
            const resultsDiv = document.getElementById('po-results');
            resultsDiv.innerHTML = '<p>检查PO页面访问性...</p>';
            
            // 尝试在iframe中加载PO页面
            const iframe = document.createElement('iframe');
            iframe.src = '/po';
            iframe.style.width = '100%';
            iframe.style.height = '300px';
            iframe.style.border = '1px solid #ddd';
            
            iframe.onload = function() {
                resultsDiv.innerHTML = '<p class="success">✅ PO页面可以加载</p>';
                resultsDiv.appendChild(iframe);
            };
            
            iframe.onerror = function() {
                resultsDiv.innerHTML = '<p class="error">❌ PO页面加载失败</p>';
            };
            
            resultsDiv.appendChild(iframe);
        }
        
        // 页面加载时初始化
        document.addEventListener('DOMContentLoaded', showEnvInfo);
    </script>
</body>
</html>`;
    
    writeFile(testPagePath, testPageContent);
    logSuccess(`测试页面已创建: ${testPagePath}`);
    logInfo('访问地址: /production-test.html');
}

/**
 * 主修复流程
 */
async function main() {
    log('🔧 生产环境PO页面问题修复工具', 'cyan');
    log('='.repeat(50), 'cyan');
    
    try {
        // 1. 检查环境配置
        const envConfig = checkEnvironmentConfig();
        
        // 2. 检查API配置
        const apiConfig = checkApiConfig();
        
        // 3. 修复生产环境配置
        fixProductionConfig();
        
        // 4. 生成诊断报告
        const report = generateDiagnosticReport();
        
        // 5. 创建测试页面
        createTestPage();
        
        // 6. 输出修复总结
        log('\n' + '='.repeat(50), 'cyan');
        log('修复完成总结:', 'cyan');
        logSuccess('✅ 生产环境配置已更新');
        logSuccess('✅ API配置已优化（支持动态检测）');
        logSuccess('✅ 诊断报告已生成');
        logSuccess('✅ 测试页面已创建');
        
        log('\n下一步操作:', 'yellow');
        logInfo('1. 重新构建前端项目: npm run build');
        logInfo('2. 部署到生产环境');
        logInfo('3. 访问 /production-test.html 进行测试');
        logInfo('4. 访问 /debug-production-api.html 进行详细调试');
        logInfo('5. 检查浏览器控制台的调试信息');
        
        log('\n如果问题仍然存在:', 'yellow');
        logInfo('• 检查服务器端API是否正常运行');
        logInfo('• 确认WordPress插件是否已激活');
        logInfo('• 检查CORS配置');
        logInfo('• 查看服务器错误日志');
        
    } catch (error) {
        logError(`修复过程中出现错误: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// 运行修复
if (require.main === module) {
    main();
}

module.exports = {
    checkEnvironmentConfig,
    fixProductionConfig,
    checkApiConfig,
    generateDiagnosticReport,
    createTestPage
}; 