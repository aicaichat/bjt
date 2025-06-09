#!/usr/bin/env node

/**
 * 树形结构验证脚本
 * 
 * 功能：验证数据库中的关联关系树形结构与前端API展示是否完全一致
 * 
 * 使用方法：
 * node scripts/verify-tree-structure.js
 * 
 * 或者添加特定的主机料号：
 * node scripts/verify-tree-structure.js 60A01149
 */

const mysql = require('mysql2/promise');
const axios = require('axios');

// 配置
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
  },
  // 产品线映射
  productLines: {
    1: 'air-cushion',
    2: 'paper', 
    3: 'tape'
  }
};

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

let currentLogLevel = LOG_LEVELS.INFO;

function log(level, message, data = null) {
  if (level <= currentLogLevel) {
    const levelNames = ['ERROR', 'WARN', 'INFO', 'DEBUG'];
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${levelNames[level]}] ${message}`);
    if (data && level <= LOG_LEVELS.INFO) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// 数据库连接
let dbConnection = null;

async function connectToDatabase() {
  try {
    dbConnection = await mysql.createConnection(CONFIG.database);
    log(LOG_LEVELS.INFO, '✅ 数据库连接成功');
    return dbConnection;
  } catch (error) {
    log(LOG_LEVELS.ERROR, '❌ 数据库连接失败', error.message);
    throw error;
  }
}

// 获取所有主机料号
async function getAllHostPartNumbers() {
  const query = `
    SELECT DISTINCT host_part_number, product_line_id
    FROM wp_bjt_relations 
    WHERE host_part_number IS NOT NULL 
    AND status = 'publish'
    ORDER BY product_line_id, host_part_number
  `;
  
  const [rows] = await dbConnection.execute(query);
  log(LOG_LEVELS.INFO, `📋 找到 ${rows.length} 个主机料号`);
  return rows;
}

// 从数据库构建树形结构
async function buildTreeFromDatabase(hostPartNumber, productLineId) {
  log(LOG_LEVELS.DEBUG, `🔨 构建数据库树结构: ${hostPartNumber} (产品线: ${productLineId})`);
  
  // 获取所有关系数据
  const query = `
    SELECT id, host_part_number, parent_part_number, part_number, child_part_number,
           child_type, level, quantity, sort_order, status
    FROM wp_bjt_relations 
    WHERE host_part_number = ? AND product_line_id = ? AND status = 'publish'
    ORDER BY sort_order, id
  `;
  
  const [relations] = await dbConnection.execute(query, [hostPartNumber, productLineId]);
  log(LOG_LEVELS.DEBUG, `📊 找到 ${relations.length} 条关系记录`);
  
  // 构建树结构
  return buildTreeNodes(relations, hostPartNumber, null, new Set());
}

// 递归构建树节点（复制前端逻辑）
function buildTreeNodes(relations, currentPartNumber, currentParentPartNumber, visitedNodes) {
  // 循环检测
  if (visitedNodes.has(currentPartNumber)) {
    log(LOG_LEVELS.WARN, `⚠️ 检测到循环引用: ${currentPartNumber}`);
    return [];
  }
  
  const newVisitedNodes = new Set(visitedNodes);
  newVisitedNodes.add(currentPartNumber);
  
  // 查找子级关系
  const childRelations = relations.filter(relation => {
    if (currentPartNumber === relation.host_part_number) {
      // 主机节点：查找 parent_part_number = null 且 part_number = 主机料号
      return relation.parent_part_number === null && 
             relation.part_number === relation.host_part_number;
    } else {
      // 其他节点：查找 part_number = 当前节点 AND parent_part_number = 当前父级
      return relation.part_number === currentPartNumber && 
             relation.parent_part_number === currentParentPartNumber;
    }
  });
  
  // 为每个子关系创建节点
  const nodes = [];
  childRelations.forEach(relation => {
    if (!relation.child_part_number) return;
    
    // 递归获取子节点
    const children = buildTreeNodes(relations, relation.child_part_number, currentPartNumber, newVisitedNodes);
    
    const node = {
      id: relation.id,
      part_number: relation.child_part_number,
      relation_id: relation.id,
      level: relation.level,
      quantity: relation.quantity,
      child_type: relation.child_type,
      children: children,
      // 用于比较的唯一标识
      uniqueKey: `${relation.host_part_number}-${relation.id}-${relation.child_part_number}`
    };
    
    nodes.push(node);
  });
  
  return nodes;
}

// 从API获取树形结构
async function getTreeFromAPI(hostPartNumber) {
  try {
    const url = `${CONFIG.api.baseUrl}/relations/${hostPartNumber}/accessories`;
    const params = {
      lang: CONFIG.api.lang,
      max_levels: CONFIG.api.maxLevels
    };
    
    log(LOG_LEVELS.DEBUG, `🌐 调用API: ${url}`, params);
    
    const response = await axios.get(url, { params });
    
    if (response.data && response.data.success && response.data.data && response.data.data.accessories) {
      return response.data.data.accessories;
    } else {
      log(LOG_LEVELS.WARN, `⚠️ API返回数据格式异常: ${hostPartNumber}`, response.data);
      return [];
    }
  } catch (error) {
    log(LOG_LEVELS.ERROR, `❌ API调用失败: ${hostPartNumber}`, error.message);
    return null;
  }
}

// 标准化树结构（用于比较）
function normalizeTree(tree, source = 'unknown') {
  if (!Array.isArray(tree)) {
    return [];
  }
  
  return tree.map(node => ({
    part_number: node.part_number,
    relation_id: parseInt(node.relation_id) || parseInt(node.id),
    level: parseInt(node.level),
    quantity: parseInt(node.quantity) || 1,
    child_type: node.child_type || 'accessory',
    children_count: (node.children || []).length,
    children: normalizeTree(node.children || [], source),
    source: source
  })).sort((a, b) => {
    // 按relation_id排序以便比较
    return a.relation_id - b.relation_id;
  });
}

// 比较两个树结构
function compareTrees(dbTree, apiTree, hostPartNumber, path = '') {
  const issues = [];
  
  // 标准化
  const normalizedDB = normalizeTree(dbTree, 'database');
  const normalizedAPI = normalizeTree(apiTree, 'api');
  
  log(LOG_LEVELS.DEBUG, `🔍 比较树结构 ${hostPartNumber}${path}:`, {
    db_count: normalizedDB.length,
    api_count: normalizedAPI.length
  });
  
  // 检查数量是否一致
  if (normalizedDB.length !== normalizedAPI.length) {
    issues.push({
      type: 'COUNT_MISMATCH',
      path: path || '根级',
      message: `节点数量不匹配: 数据库 ${normalizedDB.length} vs API ${normalizedAPI.length}`,
      db_count: normalizedDB.length,
      api_count: normalizedAPI.length
    });
  }
  
  // 创建映射以便快速查找
  const dbMap = new Map();
  const apiMap = new Map();
  
  normalizedDB.forEach(node => {
    const key = `${node.part_number}_${node.relation_id}`;
    dbMap.set(key, node);
  });
  
  normalizedAPI.forEach(node => {
    const key = `${node.part_number}_${node.relation_id}`;
    apiMap.set(key, node);
  });
  
  // 检查数据库中存在但API中缺失的节点
  for (const [key, dbNode] of dbMap) {
    if (!apiMap.has(key)) {
      issues.push({
        type: 'MISSING_IN_API',
        path: `${path}/${dbNode.part_number}`,
        message: `数据库中的节点在API中缺失`,
        node: dbNode
      });
    }
  }
  
  // 检查API中存在但数据库中缺失的节点
  for (const [key, apiNode] of apiMap) {
    if (!dbMap.has(key)) {
      issues.push({
        type: 'EXTRA_IN_API',
        path: `${path}/${apiNode.part_number}`,
        message: `API中的节点在数据库中不存在`,
        node: apiNode
      });
    }
  }
  
  // 检查共同存在的节点的属性差异
  for (const [key, dbNode] of dbMap) {
    const apiNode = apiMap.get(key);
    if (apiNode) {
      const currentPath = `${path}/${dbNode.part_number}`;
      
      // 检查属性差异
      const fieldsToCheck = ['level', 'quantity', 'child_type', 'children_count'];
      fieldsToCheck.forEach(field => {
        if (dbNode[field] !== apiNode[field]) {
          issues.push({
            type: 'PROPERTY_MISMATCH',
            path: currentPath,
            field: field,
            message: `属性 ${field} 不匹配: 数据库 ${dbNode[field]} vs API ${apiNode[field]}`,
            db_value: dbNode[field],
            api_value: apiNode[field]
          });
        }
      });
      
      // 递归检查子节点
      if (dbNode.children.length > 0 || apiNode.children.length > 0) {
        const childIssues = compareTrees(dbNode.children, apiNode.children, hostPartNumber, currentPath);
        issues.push(...childIssues);
      }
    }
  }
  
  return issues;
}

// 生成报告
function generateReport(results) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 树形结构验证报告');
  console.log('='.repeat(80));
  
  const totalHosts = results.length;
  const successfulHosts = results.filter(r => r.status === 'success').length;
  const failedHosts = results.filter(r => r.status === 'error').length;
  const hostsWithIssues = results.filter(r => r.status === 'success' && r.issues.length > 0).length;
  
  console.log(`\n📈 总体统计:`);
  console.log(`   总主机数量: ${totalHosts}`);
  console.log(`   验证成功: ${successfulHosts}`);
  console.log(`   验证失败: ${failedHosts}`);
  console.log(`   有问题的主机: ${hostsWithIssues}`);
  console.log(`   完全一致的主机: ${successfulHosts - hostsWithIssues}`);
  
  // 按产品线分组统计
  const productLineStats = {};
  results.forEach(result => {
    const line = result.product_line_id;
    if (!productLineStats[line]) {
      productLineStats[line] = { total: 0, success: 0, issues: 0 };
    }
    productLineStats[line].total++;
    if (result.status === 'success') {
      productLineStats[line].success++;
      if (result.issues.length > 0) {
        productLineStats[line].issues++;
      }
    }
  });
  
  console.log(`\n📋 按产品线统计:`);
  Object.entries(productLineStats).forEach(([lineId, stats]) => {
    const lineName = CONFIG.productLines[lineId] || `产品线${lineId}`;
    console.log(`   ${lineName}: ${stats.success}/${stats.total} 成功, ${stats.issues} 个有问题`);
  });
  
  // 详细问题报告
  if (hostsWithIssues > 0) {
    console.log(`\n❌ 问题详情:`);
    results.forEach(result => {
      if (result.status === 'success' && result.issues.length > 0) {
        console.log(`\n   主机: ${result.host_part_number} (产品线: ${result.product_line_id})`);
        console.log(`   问题数量: ${result.issues.length}`);
        
        // 按问题类型分组
        const issuesByType = {};
        result.issues.forEach(issue => {
          if (!issuesByType[issue.type]) {
            issuesByType[issue.type] = [];
          }
          issuesByType[issue.type].push(issue);
        });
        
        Object.entries(issuesByType).forEach(([type, issues]) => {
          console.log(`     ${type}: ${issues.length} 个`);
          if (issues.length <= 5) {
            issues.forEach(issue => {
              console.log(`       - ${issue.path}: ${issue.message}`);
            });
          } else {
            issues.slice(0, 3).forEach(issue => {
              console.log(`       - ${issue.path}: ${issue.message}`);
            });
            console.log(`       ... 还有 ${issues.length - 3} 个类似问题`);
          }
        });
      }
    });
  }
  
  // 失败的主机
  const failedResults = results.filter(r => r.status === 'error');
  if (failedResults.length > 0) {
    console.log(`\n💥 验证失败的主机:`);
    failedResults.forEach(result => {
      console.log(`   - ${result.host_part_number} (产品线: ${result.product_line_id}): ${result.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // 返回总结
  return {
    total: totalHosts,
    success: successfulHosts,
    failed: failedHosts,
    withIssues: hostsWithIssues,
    perfect: successfulHosts - hostsWithIssues
  };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const specificHost = args[0];
  
  try {
    // 连接数据库
    await connectToDatabase();
    
    // 获取要验证的主机列表
    let hostsToVerify;
    if (specificHost) {
      log(LOG_LEVELS.INFO, `🎯 验证指定主机: ${specificHost}`);
      const query = `
        SELECT DISTINCT host_part_number, product_line_id
        FROM wp_bjt_relations 
        WHERE host_part_number = ? AND status = 'publish'
      `;
      const [rows] = await dbConnection.execute(query, [specificHost]);
      hostsToVerify = rows;
      
      if (hostsToVerify.length === 0) {
        log(LOG_LEVELS.ERROR, `❌ 找不到主机: ${specificHost}`);
        return;
      }
    } else {
      log(LOG_LEVELS.INFO, '🔍 验证所有主机...');
      hostsToVerify = await getAllHostPartNumbers();
    }
    
    const results = [];
    
    // 逐个验证主机
    for (const host of hostsToVerify) {
      const { host_part_number, product_line_id } = host;
      
      try {
        log(LOG_LEVELS.INFO, `🔧 验证主机: ${host_part_number} (产品线: ${product_line_id})`);
        
        // 从数据库构建树
        const dbTree = await buildTreeFromDatabase(host_part_number, product_line_id);
        
        // 从API获取树
        const apiTree = await getTreeFromAPI(host_part_number);
        
        if (apiTree === null) {
          results.push({
            host_part_number,
            product_line_id,
            status: 'error',
            error: 'API调用失败'
          });
          continue;
        }
        
        // 比较树结构
        const issues = compareTrees(dbTree, apiTree, host_part_number);
        
        results.push({
          host_part_number,
          product_line_id,
          status: 'success',
          issues: issues,
          db_tree_size: dbTree.length,
          api_tree_size: apiTree.length
        });
        
        if (issues.length === 0) {
          log(LOG_LEVELS.INFO, `✅ ${host_part_number}: 完全一致`);
        } else {
          log(LOG_LEVELS.WARN, `⚠️ ${host_part_number}: 发现 ${issues.length} 个问题`);
        }
        
      } catch (error) {
        log(LOG_LEVELS.ERROR, `❌ ${host_part_number}: 验证失败`, error.message);
        results.push({
          host_part_number,
          product_line_id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // 生成报告
    const summary = generateReport(results);
    
    // 设置退出代码
    if (summary.failed > 0 || summary.withIssues > 0) {
      process.exit(1);
    } else {
      log(LOG_LEVELS.INFO, '🎉 所有主机的树形结构都完全一致！');
      process.exit(0);
    }
    
  } catch (error) {
    log(LOG_LEVELS.ERROR, '💥 脚本执行失败', error);
    process.exit(1);
  } finally {
    if (dbConnection) {
      await dbConnection.end();
      log(LOG_LEVELS.INFO, '🔌 数据库连接已关闭');
    }
  }
}

// 处理中断信号
process.on('SIGINT', async () => {
  log(LOG_LEVELS.INFO, '\n⏹️ 收到中断信号，正在清理...');
  if (dbConnection) {
    await dbConnection.end();
  }
  process.exit(0);
});

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
} 