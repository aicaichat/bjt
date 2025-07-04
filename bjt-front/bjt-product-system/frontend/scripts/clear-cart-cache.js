#!/usr/bin/env node

/**
 * 🛒 购物车缓存清理工具
 * 解决localStorage冲突导致的购物车功能异常
 */

const fs = require('fs');
const path = require('path');

// 🔧 需要清理的localStorage key列表
const CACHE_KEYS_TO_CLEAR = [
  // 购物车相关
  'bjt_mock_cart',
  'cart_admin', 
  'cart_user',
  'cart-api-cache',
  'cart-data-cache',
  'cart-summary-cache',
  'bjt-cart-cache',
  
  // 认证相关
  'auth_token',
  'user_data',
  'jwt_token',
  'auth_user',
  
  // 配置相关
  'cartBugFixFlags',
  'feature_flags',
  
  // 其他缓存
  'api_cache',
  'session_cache',
  'temp_cache'
];

// 🔧 需要检查的环境变量
const ENV_VARS_TO_CHECK = [
  'VITE_USE_MOCK_CART',
  'VITE_API_URL',
  'VITE_DEBUG',
  'VITE_USE_MOCK_DATA',
  'NODE_ENV'
];

console.log('🛒 BJT购物车缓存清理工具');
console.log('==================================');

// 1. 检查环境配置
console.log('\n🔍 检查环境配置...');
const envFiles = [
  '.env',
  '.env.local', 
  '.env.development',
  '.env.production'
];

envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ 找到环境文件: ${file}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    ENV_VARS_TO_CHECK.forEach(varName => {
      const match = content.match(new RegExp(`^${varName}=(.*)$`, 'm'));
      if (match) {
        console.log(`   ${varName}=${match[1]}`);
      }
    });
  } else {
    console.log(`❌ 未找到环境文件: ${file}`);
  }
});

// 2. 生成清理脚本
console.log('\n🔧 生成浏览器缓存清理脚本...');
const clearScript = `
// 🛒 购物车缓存清理脚本
// 在浏览器控制台中运行此脚本

console.log('🛒 开始清理购物车缓存...');

// 清理localStorage
const keysToRemove = ${JSON.stringify(CACHE_KEYS_TO_CLEAR)};
let removedCount = 0;

keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    removedCount++;
    console.log('✅ 清理localStorage key:', key);
  }
});

// 清理sessionStorage
keysToRemove.forEach(key => {
  if (sessionStorage.getItem(key)) {
    sessionStorage.removeItem(key);
    removedCount++;
    console.log('✅ 清理sessionStorage key:', key);
  }
});

// 清理IndexedDB
if ('indexedDB' in window) {
  try {
    const deleteIndexedDB = (dbName) => {
      return new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase(dbName);
        deleteReq.onsuccess = () => {
          console.log('✅ 清理IndexedDB:', dbName);
          resolve();
        };
        deleteReq.onerror = reject;
      });
    };
    
    deleteIndexedDB('bjt-cart-db').catch(e => console.warn('IndexedDB清理失败:', e));
  } catch (e) {
    console.warn('IndexedDB不可用:', e);
  }
}

// 清理Cookie
document.cookie.split(";").forEach(cookie => {
  const eqPos = cookie.indexOf("=");
  const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
  if (name.includes('cart') || name.includes('auth') || name.includes('bjt')) {
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    console.log('✅ 清理Cookie:', name);
  }
});

console.log(\`🎉 缓存清理完成！共清理了 \${removedCount} 个缓存项\`);
console.log('💡 建议刷新页面以应用更改');

// 检查当前环境配置
console.log('\\n🔍 当前环境配置:');
console.log('- 当前URL:', window.location.href);
console.log('- User Agent:', navigator.userAgent);
console.log('- 本地存储支持:', typeof Storage !== 'undefined');
console.log('- 剩余localStorage项目:', Object.keys(localStorage).length);
console.log('- 剩余sessionStorage项目:', Object.keys(sessionStorage).length);
`;

// 保存清理脚本
const scriptPath = path.join(process.cwd(), 'public', 'clear-cart-cache.js');
fs.writeFileSync(scriptPath, clearScript);
console.log(`✅ 清理脚本已保存到: ${scriptPath}`);

// 3. 生成HTML测试页面
console.log('\n🌐 生成测试页面...');
const testPageHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BJT购物车缓存清理工具</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .button { 
            background: #007cba; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            margin: 5px;
        }
        .button:hover { background: #005a87; }
        .log { 
            background: #f5f5f5; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 5px;
            max-height: 300px;
            overflow-y: auto;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛒 BJT购物车缓存清理工具</h1>
        
        <div class="section">
            <h2>🔧 缓存清理操作</h2>
            <button class="button" onclick="clearAllCache()">清理所有缓存</button>
            <button class="button" onclick="clearCartCache()">仅清理购物车缓存</button>
            <button class="button" onclick="clearAuthCache()">仅清理认证缓存</button>
            <button class="button" onclick="checkCacheStatus()">检查缓存状态</button>
        </div>
        
        <div class="section">
            <h2>📊 当前状态</h2>
            <div id="status-info"></div>
        </div>
        
        <div class="section">
            <h2>📝 操作日志</h2>
            <div id="log-output" class="log"></div>
        </div>
        
        <div class="section">
            <h2>🧪 购物车功能测试</h2>
            <button class="button" onclick="testCartAPI()">测试购物车API</button>
            <button class="button" onclick="testAuthAPI()">测试认证API</button>
        </div>
    </div>

    <script>
        const log = (message, type = 'info') => {
            const logDiv = document.getElementById('log-output');
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : '';
            logDiv.innerHTML += \`<div class="\${className}">[\${timestamp}] \${message}</div>\`;
            logDiv.scrollTop = logDiv.scrollHeight;
        };

        const clearAllCache = async () => {
            log('🛒 开始清理所有缓存...', 'info');
            
            ${clearScript.replace(/console\.log\(/g, 'log(').replace(/console\.warn\(/g, 'log(')}
            
            log('🎉 所有缓存清理完成！', 'success');
        };

        const clearCartCache = () => {
            log('🛒 开始清理购物车缓存...', 'info');
            const cartKeys = ${JSON.stringify(CACHE_KEYS_TO_CLEAR.filter(key => key.includes('cart')))};
            
            let count = 0;
            cartKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    count++;
                    log(\`✅ 清理localStorage: \${key}\`, 'success');
                }
                if (sessionStorage.getItem(key)) {
                    sessionStorage.removeItem(key);
                    count++;
                    log(\`✅ 清理sessionStorage: \${key}\`, 'success');
                }
            });
            
            log(\`🎉 购物车缓存清理完成！共清理 \${count} 项\`, 'success');
        };

        const clearAuthCache = () => {
            log('🔐 开始清理认证缓存...', 'info');
            const authKeys = ${JSON.stringify(CACHE_KEYS_TO_CLEAR.filter(key => key.includes('auth') || key.includes('token') || key.includes('user')))};
            
            let count = 0;
            authKeys.forEach(key => {
                if (localStorage.getItem(key)) {
                    localStorage.removeItem(key);
                    count++;
                    log(\`✅ 清理localStorage: \${key}\`, 'success');
                }
                if (sessionStorage.getItem(key)) {
                    sessionStorage.removeItem(key);
                    count++;
                    log(\`✅ 清理sessionStorage: \${key}\`, 'success');
                }
            });
            
            log(\`🎉 认证缓存清理完成！共清理 \${count} 项\`, 'success');
        };

        const checkCacheStatus = () => {
            const statusDiv = document.getElementById('status-info');
            const localStorage_count = Object.keys(localStorage).length;
            const sessionStorage_count = Object.keys(sessionStorage).length;
            
            statusDiv.innerHTML = \`
                <p><strong>环境信息:</strong></p>
                <ul>
                    <li>当前URL: \${window.location.href}</li>
                    <li>localStorage项目数: \${localStorage_count}</li>
                    <li>sessionStorage项目数: \${sessionStorage_count}</li>
                    <li>Cookie支持: \${navigator.cookieEnabled}</li>
                    <li>本地存储支持: \${typeof Storage !== 'undefined'}</li>
                </ul>
                
                <p><strong>localStorage内容:</strong></p>
                <pre>\${JSON.stringify(Object.keys(localStorage), null, 2)}</pre>
            \`;
            
            log('📊 缓存状态检查完成', 'info');
        };

        const testCartAPI = async () => {
            log('🧪 测试购物车API...', 'info');
            
            try {
                const response = await fetch('/wp-json/bjt/v1/cart', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    log('✅ 购物车API测试成功', 'success');
                    log(\`📦 购物车数据: \${JSON.stringify(data, null, 2)}\`, 'info');
                } else {
                    log(\`❌ 购物车API测试失败: \${response.status} \${response.statusText}\`, 'error');
                }
            } catch (error) {
                log(\`❌ 购物车API测试异常: \${error.message}\`, 'error');
            }
        };

        const testAuthAPI = async () => {
            log('🔐 测试认证API...', 'info');
            
            try {
                const response = await fetch('/wp-json/bjt/v1/auth/verify', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    log('✅ 认证API测试成功', 'success');
                    log(\`👤 认证状态: \${JSON.stringify(data, null, 2)}\`, 'info');
                } else {
                    log(\`❌ 认证API测试失败: \${response.status} \${response.statusText}\`, 'error');
                }
            } catch (error) {
                log(\`❌ 认证API测试异常: \${error.message}\`, 'error');
            }
        };

        // 页面加载时自动检查状态
        window.addEventListener('load', () => {
            checkCacheStatus();
            log('🚀 页面加载完成，缓存清理工具已就绪', 'info');
        });
    </script>
</body>
</html>
`;

const testPagePath = path.join(process.cwd(), 'public', 'cart-cache-cleaner.html');
fs.writeFileSync(testPagePath, testPageHtml);
console.log(`✅ 测试页面已保存到: ${testPagePath}`);

// 4. 输出使用说明
console.log('\n📋 使用说明:');
console.log('1. 在浏览器中打开: http://localhost:5173/cart-cache-cleaner.html');
console.log('2. 点击"清理所有缓存"按钮');
console.log('3. 刷新页面，重新测试购物车功能');
console.log('');
console.log('🔍 手动清理方法:');
console.log('1. 打开浏览器开发者工具(F12)');
console.log('2. 进入Application/Storage标签页');
console.log('3. 清理Local Storage和Session Storage');
console.log('4. 或者在控制台运行: localStorage.clear(); sessionStorage.clear();');
console.log('');
console.log('💡 提示: 如果问题仍然存在，请检查网络请求是否正常返回');
console.log('');
console.log('✅ 脚本生成完成！'); 