// 🔧 关系管理页面立即修复脚本
// 在浏览器控制台中执行：copy(fixRelationsScript) 然后粘贴执行

const fixRelationsScript = `
console.log('🔧 开始修复关系管理页面显示问题...');

// 1. 强制清理所有相关缓存
function clearRelationsCache() {
  const keys = Object.keys(localStorage);
  const relatedKeys = keys.filter(key => 
    key.includes('relation') || 
    key.includes('admin') || 
    key.includes('host') ||
    key.includes('bjt')
  );
  
  relatedKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  console.log('✅ 已清理缓存：', relatedKeys);
}

// 2. 验证当前选择的主机
function getCurrentHost() {
  const hostSelect = document.querySelector('input[placeholder*="主机"], select[data-testid="host-select"], .ant-select-selection-item');
  if (hostSelect) {
    const selectedHost = hostSelect.textContent || hostSelect.value;
    console.log('📋 当前选择主机：', selectedHost);
    return selectedHost;
  }
  return null;
}

// 3. 检测错误的关系显示
function detectWrongRelations() {
  const currentHost = getCurrentHost();
  if (!currentHost) {
    console.warn('❌ 无法检测到当前选择的主机');
    return;
  }
  
  const pathElements = document.querySelectorAll('[class*="path"], [data-testid*="path"]');
  const wrongPaths = [];
  
  pathElements.forEach(element => {
    const pathText = element.textContent;
    if (pathText && pathText.includes('→')) {
      const hostInPath = pathText.split('→')[0].trim();
      if (hostInPath !== currentHost.split(' ')[0]) {
        wrongPaths.push({
          element,
          pathText,
          expectedHost: currentHost.split(' ')[0],
          actualHost: hostInPath
        });
      }
    }
  });
  
  if (wrongPaths.length > 0) {
    console.error('❌ 发现错误的关系显示：', wrongPaths);
    return wrongPaths;
  } else {
    console.log('✅ 未发现错误的关系显示');
    return [];
  }
}

// 4. 隐藏错误的关系记录
function hideWrongRelations() {
  const wrongPaths = detectWrongRelations();
  
  wrongPaths.forEach(({ element }) => {
    // 找到包含这个路径的整个关系记录
    let relationRecord = element.closest('[class*="relation"], .ant-tree-node, tr, [data-testid*="relation"]');
    if (relationRecord) {
      relationRecord.style.display = 'none';
      relationRecord.style.border = '2px solid red';
      relationRecord.title = '此记录数据错误，已隐藏';
      console.log('🔧 已隐藏错误记录：', relationRecord);
    }
  });
  
  if (wrongPaths.length > 0) {
    alert(\`🔧 已隐藏 \${wrongPaths.length} 个错误的关系记录。请刷新页面查看修复效果。\`);
  }
}

// 5. 强制重新加载关系数据
function forceReloadRelations() {
  // 尝试找到刷新按钮
  const refreshButtons = document.querySelectorAll('button[class*="refresh"], button[title*="刷新"], button[aria-label*="刷新"]');
  
  if (refreshButtons.length > 0) {
    console.log('🔄 触发数据刷新...');
    refreshButtons[0].click();
  } else {
    console.log('🔄 手动刷新页面...');
    window.location.reload();
  }
}

// 6. 主修复流程
function fixRelations() {
  console.log('🚀 开始执行修复流程...');
  
  // 步骤1：清理缓存
  clearRelationsCache();
  
  // 步骤2：检测和隐藏错误记录
  setTimeout(() => {
    hideWrongRelations();
  }, 100);
  
  // 步骤3：强制重新加载（给用户选择）
  setTimeout(() => {
    const shouldReload = confirm('🔄 是否重新加载页面以获取干净的数据？\\n（建议选择"确定"）');
    if (shouldReload) {
      forceReloadRelations();
    }
  }, 500);
}

// 执行修复
fixRelations();

console.log('✅ 修复脚本执行完成！');
`;

// 如果在浏览器环境中，直接执行
if (typeof window !== 'undefined') {
  eval(fixRelationsScript);
}

// 导出脚本供复制使用
if (typeof module !== 'undefined') {
  module.exports = fixRelationsScript;
} 