
// 🛒 购物车缓存清理脚本
// 在浏览器控制台中运行此脚本

console.log('🛒 开始清理购物车缓存...');

// 清理localStorage
const keysToRemove = ["bjt_mock_cart","cart_admin","cart_user","cart-api-cache","cart-data-cache","cart-summary-cache","bjt-cart-cache","auth_token","user_data","jwt_token","auth_user","cartBugFixFlags","feature_flags","api_cache","session_cache","temp_cache"];
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

console.log(`🎉 缓存清理完成！共清理了 ${removedCount} 个缓存项`);
console.log('💡 建议刷新页面以应用更改');

// 检查当前环境配置
console.log('\n🔍 当前环境配置:');
console.log('- 当前URL:', window.location.href);
console.log('- User Agent:', navigator.userAgent);
console.log('- 本地存储支持:', typeof Storage !== 'undefined');
console.log('- 剩余localStorage项目:', Object.keys(localStorage).length);
console.log('- 剩余sessionStorage项目:', Object.keys(sessionStorage).length);
