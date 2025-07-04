// 🔍 关系管理页面CDN修复验证脚本
// 在浏览器控制台中直接复制粘贴执行

console.log('🔍 开始关系管理页面CDN修复验证...');

// 立即执行验证
(function() {
  console.log('📊 === 系统状态检查 ===');
  
  // 1. 检查当前页面
  const isRelationsPage = window.location.href.includes('/admin/relations') || 
                         document.title.includes('关系管理');
  console.log(`✅ 关系管理页面: ${isRelationsPage ? '是' : '否'}`);
  
  // 2. 检查主机选择器
  const hostSelector = document.querySelector('.ant-select-selection-item');
  const currentHost = hostSelector ? hostSelector.textContent.split(' ')[0] : null;
  console.log(`✅ 当前主机: ${currentHost || '未检测到'}`);
  
  // 3. 检查关系树
  const treeNodes = document.querySelectorAll('.ant-tree-node');
  console.log(`✅ 关系树节点数: ${treeNodes.length}`);
  
  // 4. 数据完整性检查
  if (currentHost && treeNodes.length > 0) {
    let wrongDataCount = 0;
    const wrongNodes = [];
    
    treeNodes.forEach((node, index) => {
      const text = node.textContent;
      if (text && text.includes('Path: ')) {
        const pathMatch = text.match(/Path: (\w+)/);
        if (pathMatch && pathMatch[1] !== currentHost) {
          wrongDataCount++;
          wrongNodes.push({
            index,
            wrongHost: pathMatch[1],
            element: node
          });
          console.log(`❌ 错误节点 ${index}: 显示 ${pathMatch[1]}，期望 ${currentHost}`);
        }
      }
    });
    
    if (wrongDataCount === 0) {
      console.log('✅ 数据完整性检查: 通过');
    } else {
      console.log(`❌ 数据完整性检查: 发现 ${wrongDataCount} 个错误节点`);
      
      // 提供修复选项
      if (confirm(`发现 ${wrongDataCount} 个错误的关系记录，是否立即隐藏？`)) {
        wrongNodes.forEach(({ element }) => {
          element.style.display = 'none';
          element.style.border = '3px solid red';
          element.title = '数据错误已隐藏';
        });
        console.log(`✅ 已隐藏 ${wrongDataCount} 个错误节点`);
        
        // 尝试刷新
        const refreshBtn = document.querySelector('button[title*="刷新"]');
        if (refreshBtn) {
          console.log('🔄 触发数据刷新...');
          refreshBtn.click();
        }
      }
    }
  }
  
  // 5. API监听设置
  console.log('📡 === 设置API监听 ===');
  
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    
    if (typeof url === 'string' && url.includes('/wp-json/bjt/v1/relations')) {
      console.log(`🔍 拦截关系API: ${url}`);
      
      const hasHostParam = url.includes('host_part_number');
      const hasCacheKey = url.includes('_cache_key');
      const hasTimestamp = url.includes('_t=');
      
      console.log(`   📋 host_part_number: ${hasHostParam ? '✅' : '❌'}`);
      console.log(`   📋 _cache_key: ${hasCacheKey ? '✅' : '❌'}`);
      console.log(`   📋 时间戳: ${hasTimestamp ? '✅' : '❌'}`);
      
      if (hasHostParam && hasCacheKey) {
        console.log('✅ API参数检查: 通过');
      } else {
        console.log('❌ API参数检查: 失败 - 缺少关键隔离参数');
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  console.log('✅ API监听已启动');
  
  // 6. 提供工具函数
  window.relationsCDNFix = {
    checkData: function() {
      const host = document.querySelector('.ant-select-selection-item')?.textContent?.split(' ')[0];
      const nodes = document.querySelectorAll('.ant-tree-node');
      let wrongCount = 0;
      
      nodes.forEach(node => {
        const text = node.textContent;
        if (text && text.includes('Path: ')) {
          const match = text.match(/Path: (\w+)/);
          if (match && match[1] !== host) {
            wrongCount++;
          }
        }
      });
      
      console.log(`数据检查结果: 当前主机 ${host}, 错误节点 ${wrongCount} 个`);
      return { host, wrongCount };
    },
    
    hideWrongData: function() {
      const host = document.querySelector('.ant-select-selection-item')?.textContent?.split(' ')[0];
      let hiddenCount = 0;
      
      document.querySelectorAll('.ant-tree-node').forEach(node => {
        const text = node.textContent;
        if (text && text.includes('Path: ')) {
          const match = text.match(/Path: (\w+)/);
          if (match && match[1] !== host) {
            node.style.display = 'none';
            node.style.border = '3px solid red';
            hiddenCount++;
          }
        }
      });
      
      console.log(`✅ 已隐藏 ${hiddenCount} 个错误节点`);
      return hiddenCount;
    },
    
    clearCache: function() {
      const keys = Object.keys(localStorage).filter(key => 
        key.includes('relation') || key.includes('admin') || key.includes('bjt')
      );
      
      keys.forEach(key => localStorage.removeItem(key));
      console.log(`✅ 已清理 ${keys.length} 个缓存键`);
      return keys.length;
    }
  };
  
  console.log('\n💡 可用工具:');
  console.log('- relationsCDNFix.checkData(): 检查数据完整性');
  console.log('- relationsCDNFix.hideWrongData(): 隐藏错误数据');
  console.log('- relationsCDNFix.clearCache(): 清理相关缓存');
  console.log('\n🎯 建议: 切换不同主机验证修复效果');
  
})(); 