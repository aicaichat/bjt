#!/usr/bin/env node
/**
 * Figma 设计数据同步工具
 * - 智能缓存避免 API 限流
 * - 指数退避重试机制
 * - 本地 JSON 缓存保存
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  token: process.env.FIGMA_TOKEN || '',
  fileKey: 'QluTLuKXbauHIiCN8AZUGJ',
  cacheDir: path.join(__dirname, '../.figma-cache'),
  cacheFile: path.join(__dirname, '../.figma-cache/figma-data.json'),
  cacheDuration: 24 * 60 * 60 * 1000,
  maxRetries: 5,
  baseDelay: 3000,
};

// 关键节点映射
const KEY_NODES = {
  'home': { id: '2679:24930', name: 'Home', route: '/' },
  'machines-p1': { id: '2679:22612', name: 'Machines P1', route: '/machines/product-line-1' },
  'machines-p2': { id: '2700:20514', name: 'Machines P2', route: '/machines/product-line-2' },
  'consumables': { id: '2679:22464', name: 'Consumables', route: '/consumables' },
  'cart': { id: '2700:16715', name: 'Cart', route: '/cart' },
};

// 日志
const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
};

// 确保缓存目录存在
function ensureCacheDir() {
  if (!fs.existsSync(CONFIG.cacheDir)) {
    fs.mkdirSync(CONFIG.cacheDir, { recursive: true });
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
    ...data,
  };
  fs.writeFileSync(CONFIG.cacheFile, JSON.stringify(cacheData, null, 2));
  log.success(`缓存已保存`);
}

// HTTP 请求
function fetch(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'X-Figma-Token': CONFIG.token },
      timeout: 30000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 429) reject(new Error('RATE_LIMIT'));
          else if (json.err) reject(new Error(json.err));
          else resolve(json);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('TIMEOUT')); });
  });
}

// 指数退避重试
async function fetchWithRetry(url, retryCount = 0) {
  try {
    return await fetch(url);
  } catch (error) {
    if (error.message === 'RATE_LIMIT' && retryCount < CONFIG.maxRetries) {
      const delay = CONFIG.baseDelay * Math.pow(2, retryCount);
      log.warn(`Rate limited, ${delay}ms 后重试...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(url, retryCount + 1);
    }
    throw error;
  }
}

// 批量获取节点
async function fetchNodesBatch(nodeIds) {
  const ids = nodeIds.map(id => id.replace(':', '-')).join(',');
  // 减少 depth 到 1 以减少数据量和限流风险
  const url = `https://api.figma.com/v1/files/${CONFIG.fileKey}/nodes?ids=${ids}&depth=1`;
  log.info(`获取节点: ${nodeIds.join(', ')}`);
  return fetchWithRetry(url);
}

// 获取单个节点详情（用于获取图标）
async function fetchNodeImage(nodeId, format = 'svg') {
  const id = nodeId.replace(':', '-');
  const url = `https://api.figma.com/v1/images/${CONFIG.fileKey}?ids=${id}&format=${format}`;
  log.info(`获取节点图片: ${nodeId}`);
  return fetchWithRetry(url);
}

// 主同步函数
async function sync() {
  log.info('开始 Figma 数据同步...');

  if (!CONFIG.token) {
    log.error('未设置 FIGMA_TOKEN 环境变量');
    process.exit(1);
  }

  // 检查缓存
  const cache = readCache();
  if (cache.valid && process.argv.includes('--use-cache')) {
    log.success('使用有效缓存');
    return cache.data;
  }

  // 分批获取节点 - 使用更保守的策略避免限流
  const nodeEntries = Object.entries(KEY_NODES);
  const batchSize = 1; // 减少到每次只获取1个节点
  const results = { nodes: {}, tokens: {} };

  for (let i = 0; i < nodeEntries.length; i += batchSize) {
    const batch = nodeEntries.slice(i, i + batchSize);
    const ids = batch.map(([, v]) => v.id);

    try {
      const data = await fetchNodesBatch(ids);
      Object.assign(results.nodes, data.nodes || {});

      // 批次间延迟增加到 10 秒
      if (i + batchSize < nodeEntries.length) {
        log.info('等待 10 秒...');
        await new Promise(r => setTimeout(r, 10000));
      }
    } catch (e) {
      log.error(`获取失败: ${e.message}`);
    }
  }

  // 保存缓存
  writeCache(results);
  log.info('同步完成!');
  return results;
}

// 获取图片资源（SVG/PNG）
async function fetchImages(nodeIds, format = 'svg') {
  const ids = nodeIds.map(id => id.replace(':', '-')).join(',');
  const url = `https://api.figma.com/v1/images/${CONFIG.fileKey}?ids=${ids}&format=${format}&svg_include_id=false`;
  log.info(`获取图片: ${nodeIds.join(', ')} (格式: ${format})`);
  return fetchWithRetry(url);
}

// 下载文件到本地
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 跟随重定向
        https.get(response.headers.location, (redirectRes) => {
          redirectRes.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(outputPath);
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(outputPath);
        });
      }
    }).on('error', reject);
  });
}

// 导出 SVG 图标
async function exportIcons(nodeIds, names) {
  log.info('开始导出图标...');

  if (!CONFIG.token) {
    log.error('未设置 FIGMA_TOKEN 环境变量');
    process.exit(1);
  }

  const iconsDir = path.join(__dirname, '../src/assets/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  try {
    const result = await fetchImages(nodeIds, 'svg');

    if (result.images) {
      for (const [nodeId, imageUrl] of Object.entries(result.images)) {
        if (imageUrl) {
          const name = names[nodeId] || nodeId.replace(':', '-');
          const outputPath = path.join(iconsDir, `${name}.svg`);
          await downloadFile(imageUrl, outputPath);
          log.success(`已保存: ${outputPath}`);
        }
      }
    }
  } catch (e) {
    log.error(`导出失败: ${e.message}`);
  }
}

// 命令入口
const command = process.argv[2];

switch (command) {
  case 'sync':
    sync().catch(e => { log.error(e.message); process.exit(1); });
    break;
  case 'cache':
    console.log(JSON.stringify(readCache().data, null, 2));
    break;
  case 'export-icons':
    // 用法: node figma-sync.js export-icons "1699:2614,1699:2615" "icon1,icon2"
    const ids = process.argv[3]?.split(',') || [];
    const names = {};
    process.argv[4]?.split(',').forEach((name, i) => {
      if (ids[i]) names[ids[i].replace('-', ':')] = name;
    });
    exportIcons(ids, names).catch(e => { log.error(e.message); process.exit(1); });
    break;
  default:
    console.log(`用法:
  FIGMA_TOKEN=xxx node figma-sync.js sync
  FIGMA_TOKEN=xxx node figma-sync.js export-icons "node-id-1,node-id-2" "name1,name2"`);
}
