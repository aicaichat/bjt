#!/usr/bin/env node
/**
 * Figma 设计数据同步工具
 * - 智能缓存避免 API 限流
 * - 指数退避重试机制
 * - 本地 JSON 缓存保存
 * - 定时任务支持
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 配置
const CONFIG = {
  token: process.env.FIGMA_TOKEN || '',
  fileKey: 'QluTLuKXbauHIiCN8AZUGJ',
  cacheDir: path.join(__dirname, '../.figma-cache'),
  cacheFile: path.join(__dirname, '../.figma-cache/figma-data.json'),
  cacheDuration: 24 * 60 * 60 * 1000, // 24小时
  maxRetries: 5,
  baseDelay: 3000, // 3秒基础延迟
};

// 关键节点映射
const KEY_NODES = {
  'home': { id: '2679:24930', name: 'Home', route: '/' },
  'machines-p1': { id: '2679:22612', name: 'Machines P1', route: '/machines/product-line-1' },
  'machines-p2': { id: '2700:20514', name: 'Machines P2', route: '/machines/product-line-2' },
  'consumables': { id: '2679:22464', name: 'Consumables', route: '/consumables' },
  'cart': { id: '2700:16715', name: 'Cart', route: '/cart' },
  'header': { id: '2679:22645', name: 'Header', component: 'shell' },
  'sidebar': { id: '2443:17459', name: 'Sidebar', component: 'shell' },
};

// 颜色日志
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
};

// 确保缓存目录存在
function ensureCacheDir() {
  if (!fs.existsSync(CONFIG.cacheDir)) {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
    log.info(`创建缓存目录: ${CONFIG.cacheDir}`);
  }
}

// 读取缓存
function readCache() {
  try {
    if (fs.existsSync(CONFIG.cacheFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.cacheFile, 'utf-8'));
      const age = Date.now() - (data._meta?.lastUpdated || 0);
      return { data, age, valid: age < CONFIG.cacheDuration };
    }
  } catch (e) {
    log.error(`读取缓存失败: ${e.message}`);
  }
  return { data: null, age: Infinity, valid: false };
}

// 写入缓存
function writeCache(data) {
  ensureCacheDir();
  const cacheData = {
    _meta: {
      lastUpdated: Date.now(),
      fileKey: CONFIG.fileKey,
      version: '1.0',
    },
    nodes: data,
  };
  fs.writeFileSync(CONFIG.cacheFile, JSON.stringify(cacheData, null, 2));
  log.success(`缓存已保存: ${CONFIG.cacheFile}`);
}

// HTTP 请求封装
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'X-Figma-Token': CONFIG.token,
        ...options.headers,
      },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 429) {
            reject(new Error('RATE_LIMIT'));
          } else if (json.err) {
            reject(new Error(json.err));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('TIMEOUT'));
    });
  });
}

// 指数退避重试
async function fetchWithRetry(url, retryCount = 0) {
  try {
    return await fetch(url);
  } catch (error) {
    if (error.message === 'RATE_LIMIT' && retryCount < CONFIG.maxRetries) {
      const delay = CONFIG.baseDelay * Math.pow(2, retryCount);
      log.warn(`Rate limited, ${delay}ms 后重试 (${retryCount + 1}/${CONFIG.maxRetries})...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
}

// 批量获取节点 (减少 API 调用)
async function fetchNodesBatch(nodeIds) {
  const ids = nodeIds.map(id => id.replace(':', '-')).join(',');
  const url = `https://api.figma.com/v1/files/${CONFIG.fileKey}/nodes?ids=${ids}&depth=2`;
  log.info(`获取节点: ${nodeIds.join(', ')}`);
  return fetchWithRetry(url);
}

// 提取设计令牌
function extractTokens(nodeData) {
  const tokens = {
    colors: {},
    spacing: {},
    typography: {},
    effects: {},
  };

  // 递归遍历节点提取样式
  function traverse(node, path = '') {
    const currentPath = path ? `${path}/${node.name}` : node.name;

    // 提取颜色
    if (node.fills && node.fills[0]) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        const { r, g, b } = fill.color;
        const hex = `#${[r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
        tokens.colors[currentPath] = hex;
      }
    }

    // 提取间距
    if (node.absoluteBoundingBox) {
      const { width, height, x, y } = node.absoluteBoundingBox;
      tokens.spacing[currentPath] = { width, height, x, y };
    }

    // 提取字体
    if (node.style) {
      tokens.typography[currentPath] = {
        fontFamily: node.style.fontFamily,
        fontSize: node.style.fontSize,
        fontWeight: node.style.fontWeight,
        lineHeight: node.style.lineHeightPercent,
      };
    }

    // 递归子节点
    if (node.children) {
      node.children.forEach(child => traverse(child, currentPath));
    }
  }

  Object.values(nodeData).forEach(node => {
    if (node.document) traverse(node.document);
  });

  return tokens;
}

// 生成 CSS 变量
function generateCSS(tokens) {
  const lines = ['/* Figma Design Tokens - Auto Generated */', ':root {'];

  // 颜色
  Object.entries(tokens.colors).forEach(([path, value]) => {
    const key = path.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    lines.push(`  --figma-${key}: ${value};`);
  });

  // 间距
  Object.entries(tokens.spacing).forEach(([path, value]) => {
    if (value.width) {
      const key = path.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      lines.push(`  --figma-${key}-width: ${value.width}px;`);
      lines.push(`  --figma-${key}-height: ${value.height}px;`);
    }
  });

  lines.push('}');
  return lines.join('\n');
}

// 主同步函数
async function sync() {
  log.info('开始 Figma 数据同步...');

  // 检查 Token
  if (!CONFIG.token) {
    log.error('未设置 FIGMA_TOKEN 环境变量');
    log.info('使用方法: FIGMA_TOKEN=figd_xxx node figma-sync.js');
    process.exit(1);
  }

  // 检查缓存
  const cache = readCache();
  if (cache.valid && process.argv.includes('--use-cache')) {
    log.success('使用有效缓存');
    console.log(JSON.stringify(cache.data, null, 2));
    return cache.data;
  }

  // 分批获取节点 (避免单次请求过多)
  const nodeEntries = Object.entries(KEY_NODES);
  const batchSize = 3;
  const results = {};

  for (let i = 0; i < nodeEntries.length; i += batchSize) {
    const batch = nodeEntries.slice(i, i + batchSize);
    const ids = batch.map(([, v]) => v.id);

    try {
      const data = await fetchNodesBatch(ids);
      Object.assign(results, data.nodes || {});

      // 批次间延迟，避免触发限流
      if (i + batchSize < nodeEntries.length) {
        log.info('等待 5 秒后继续...');
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) {
      log.error(`获取批次失败: ${e.message}`);
    }
  }

  // 提取令牌
  const tokens = extractTokens(results);

  // 保存缓存
  writeCache({ nodes: results, tokens });

  // 生成并保存 CSS
  const css = generateCSS(tokens);
  const cssPath = path.join(CONFIG.cacheDir, 'figma-tokens.css');
  fs.writeFileSync(cssPath, css);
  log.success(`CSS 令牌已保存: ${cssPath}`);

  // 输出摘要
  log.info('同步完成!');
  log.info(`节点数: ${Object.keys(results).length}`);
  log.info(`颜色数: ${Object.keys(tokens.colors).length}`);
  log.info(`间距数: ${Object.keys(tokens.spacing).length}`);

  return { nodes: results, tokens };
}

// 定时任务模式
function startScheduler(intervalHours = 6) {
  log.info(`启动定时任务，每 ${intervalHours} 小时同步一次`);
  sync().catch(console.error);

  setInterval(() => {
    log.info('执行定时同步...');
    sync().catch(console.error);
  }, intervalHours * 60 * 60 * 1000);
}

// 命令行入口
const command = process.argv[2];

switch (command) {
  case 'sync':
    sync().catch(e => {
      log.error(e.message);
      process.exit(1);
    });
    break;
  case 'scheduler':
    const hours = parseInt(process.argv[3]) || 6;
    startScheduler(hours);
    break;
  case 'cache':
    const cache = readCache();
    console.log(JSON.stringify(cache.data, null, 2));
    break;
  default:
    console.log(`
Figma 数据同步工具

用法:
  FIGMA_TOKEN=figd_xxx node figma-sync.js <command>

命令:
  sync              立即同步数据
  scheduler [hrs]   启动定时任务 (默认6小时)
  cache             查看缓存内容

选项:
  --use-cache       优先使用缓存

示例:
  FIGMA_TOKEN=figd_xxx node figma-sync.js sync
  FIGMA_TOKEN=figd_xxx node figma-sync.js scheduler 12
`);
}

module.exports = { sync, readCache, extractTokens };
