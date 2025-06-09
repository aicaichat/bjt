#!/usr/bin/env node

/**
 * 快速树形结构测试脚本
 * 
 * 专门用于测试单个主机的树形结构一致性
 * 适合在开发和调试过程中快速验证
 */

const mysql = require('mysql2/promise');
const axios = require('axios');

// 简化配置 - 直接在脚本中修改
const CONFIG = {
  database: {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'bjt_product',
    port: 3306
  },
  api: {
    baseUrl: 'http://localhost:8080/wp-json/bjt/v1',
    maxLevels: 5,
    lang: 'zh'
  }
};

// 要测试的主机料号 - 在这里修改
const TEST_HOST = process.argv[2] || '60A01149';
const PRODUCT_LINE_ID = 1; // 气垫机产品线

console.log(`🎯 快速测试主机: ${TEST_HOST}`);
console.log('='.repeat(50));

async function quickTest() {
  let connection = null;
  
  try {
    // 连接数据库
    connection = await mysql.createConnection(CONFIG.database);
    console.log('✅ 数据库连接成功');
    
    // 1. 获取数据库关系数据
    console.log('\n📊 从数据库获取关系数据...');
    const [relations] = await connection.execute(
      `SELECT id, host_part_number, parent_part_number, part_number, child_part_number,
              child_type, level, quantity, sort_order
       FROM wp_bjt_relations 
       WHERE host_part_number = ? AND product_line_id = ? AND status = 'publish'
       ORDER BY sort_order, id`,
      [TEST_HOST, PRODUCT_LINE_ID]
    );
    
    console.log(`📋 找到 ${relations.length} 条关系记录`);
    
    // 显示关系数据样本
    if (relations.length > 0) {
      console.log('\n📝 关系数据样本:');
      relations.slice(0, 5).forEach((rel, index) => {
        console.log(`   ${index + 1}. ID:${rel.id} ${rel.part_number} → ${rel.child_part_number} (Level:${rel.level}, Parent:${rel.parent_part_number || 'NULL'})`);
      });
      if (relations.length > 5) {
        console.log(`   ... 还有 ${relations.length - 5} 条记录`);
      }
    }
    
    // 2. 调用API获取树形结构
    console.log('\n🌐 调用API获取树形结构...');
    const apiUrl = `${CONFIG.api.baseUrl}/relations/${TEST_HOST}/accessories`;
    const response = await axios.get(apiUrl, {
      params: {
        lang: CONFIG.api.lang,
        max_levels: CONFIG.api.maxLevels
      }
    });
    
    if (response.data && response.data.success && response.data.data) {
      const apiTree = response.data.data.accessories;
      console.log(`📊 API返回 ${apiTree.length} 个顶级节点`);
      
      // 显示API树形结构
      console.log('\n🌲 API树形结构:');
      displayTree(apiTree, '', 0);
      
      // 3. 简单统计对比
      console.log('\n📈 统计对比:');
      const dbStats = analyzeDbRelations(relations);
      const apiStats = analyzeApiTree(apiTree);
      
      console.log(`   数据库关系记录数: ${relations.length}`);
      console.log(`   数据库唯一子配件数: ${dbStats.uniqueChildren}`);
      console.log(`   API树节点总数: ${apiStats.totalNodes}`);
      console.log(`   API最大深度: ${apiStats.maxDepth}`);
      
      // 4. 快速一致性检查
      console.log('\n🔍 快速一致性检查:');
      const issues = [];
      
      // 检查顶级节点数量
      const dbTopLevel = relations.filter(r => r.parent_part_number === null).length;
      if (dbTopLevel !== apiTree.length) {
        issues.push(`顶级节点数量不匹配: 数据库 ${dbTopLevel} vs API ${apiTree.length}`);
      }
      
      // 检查是否有API中的节点在数据库中找不到
      const dbChildParts = new Set(relations.map(r => r.child_part_number));
      const apiParts = extractAllApiParts(apiTree);
      const missingInDb = apiParts.filter(part => !dbChildParts.has(part));
      const extraInApi = Array.from(dbChildParts).filter(part => !apiParts.includes(part));
      
      if (missingInDb.length > 0) {
        issues.push(`API中有${missingInDb.length}个配件在数据库中找不到: ${missingInDb.slice(0, 3).join(', ')}${missingInDb.length > 3 ? '...' : ''}`);
      }
      
      if (extraInApi.length > 0) {
        issues.push(`数据库中有${extraInApi.length}个配件在API中找不到: ${extraInApi.slice(0, 3).join(', ')}${extraInApi.length > 3 ? '...' : ''}`);
      }
      
      if (issues.length === 0) {
        console.log('   ✅ 快速检查通过，结构基本一致');
      } else {
        console.log('   ⚠️ 发现潜在问题:');
        issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      }
      
    } else {
      console.log('❌ API调用失败或返回数据格式异常');
      console.log('   响应数据:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 显示树形结构
function displayTree(nodes, prefix = '', depth = 0) {
  if (depth > 3) { // 限制显示深度
    console.log(`${prefix}└─ ... (省略更深层级)`);
    return;
  }
  
  nodes.forEach((node, index) => {
    const isLast = index === nodes.length - 1;
    const connector = isLast ? '└─' : '├─';
    const childPrefix = prefix + (isLast ? '   ' : '│  ');
    
    console.log(`${prefix}${connector} ${node.part_number} (Level:${node.level}, Qty:${node.quantity}, Type:${node.child_type || 'accessory'})`);
    
    if (node.children && node.children.length > 0) {
      displayTree(node.children, childPrefix, depth + 1);
    }
  });
}

// 分析数据库关系
function analyzeDbRelations(relations) {
  const uniqueChildren = new Set(relations.map(r => r.child_part_number)).size;
  return { uniqueChildren };
}

// 分析API树形结构
function analyzeApiTree(tree) {
  let totalNodes = 0;
  let maxDepth = 0;
  
  function traverse(nodes, depth = 1) {
    totalNodes += nodes.length;
    maxDepth = Math.max(maxDepth, depth);
    
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    });
  }
  
  traverse(tree);
  return { totalNodes, maxDepth };
}

// 提取API中的所有配件料号
function extractAllApiParts(tree) {
  const parts = [];
  
  function traverse(nodes) {
    nodes.forEach(node => {
      parts.push(node.part_number);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }
  
  traverse(tree);
  return parts;
}

// 运行快速测试
quickTest().catch(error => {
  console.error('未捕获的错误:', error);
  process.exit(1);
}); 