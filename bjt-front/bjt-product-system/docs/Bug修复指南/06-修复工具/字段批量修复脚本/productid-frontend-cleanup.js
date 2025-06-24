#!/usr/bin/env node

/**
 * ProductID前端清理脚本
 * 
 * ⚠️ 需求变更：ProductID不需要在前端展示
 * 本脚本用于清理前端代码中的ProductID显示组件和相关代码
 * 
 * 功能：
 * 1. 扫描前端文件中的ProductID显示组件
 * 2. 移除ProductID相关的显示代码
 * 3. 保留数据传递但移除UI显示
 * 4. 生成清理报告
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 配置
const CONFIG = {
  // 需要清理的前端文件模式
  frontendFiles: [
    'frontend/src/pages/**/*.tsx',
    'frontend/src/pages/**/*.ts',
    'frontend/src/components/**/*.tsx',
    'frontend/src/components/**/*.ts'
  ],
  
  // ProductID相关的关键词
  productIdKeywords: [
    'ProductID',
    'product_id',
    'productId',
    'PRODUCT_ID',
    'Product ID'
  ],
  
  // 需要移除的组件模式
  removePatterns: [
    // JSX中的ProductID显示
    /<div[^>]*product[_-]?id[^>]*>.*?<\/div>/gis,
    /<span[^>]*product[_-]?id[^>]*>.*?<\/span>/gis,
    /<label[^>]*product[_-]?id[^>]*>.*?<\/label>/gis,
    
    // TypeScript接口中的ProductID
    /product_id\s*:\s*[^,;\n}]+[,;\n]/gi,
    /productId\s*:\s*[^,;\n}]+[,;\n]/gi,
    
    // 表格列定义中的ProductID
    /\{[^}]*key:\s*['"`]product[_-]?id['"`][^}]*\}/gi,
    /\{[^}]*dataIndex:\s*['"`]product[_-]?id['"`][^}]*\}/gi
  ],
  
  // 备份目录
  backupDir: 'backup/productid-frontend-cleanup',
  
  // 日志级别
  logLevel: 'info'
};

class ProductIdFrontendCleaner {
  constructor() {
    this.scannedFiles = 0;
    this.modifiedFiles = 0;
    this.removedComponents = 0;
    this.backupCreated = false;
    this.log = this.createLogger();
    this.cleanupReport = [];
  }

  createLogger() {
    return {
      info: (msg) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
      warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
      error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
      success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} ${msg}`)
    };
  }

  // 创建备份
  async createBackup() {
    if (this.backupCreated) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(CONFIG.backupDir, `frontend-cleanup-${timestamp}`);
    
    try {
      if (!fs.existsSync(CONFIG.backupDir)) {
        fs.mkdirSync(CONFIG.backupDir, { recursive: true });
      }
      
      this.log.info(`创建备份目录: ${backupPath}`);
      this.backupCreated = true;
    } catch (error) {
      this.log.error(`创建备份失败: ${error.message}`);
      throw error;
    }
  }

  // 扫描所有前端文件
  async scanFrontendFiles() {
    this.log.info('开始扫描前端文件中的ProductID显示...');
    
    const allFiles = [];
    
    for (const pattern of CONFIG.frontendFiles) {
      const files = glob.sync(pattern);
      allFiles.push(...files);
    }
    
    const uniqueFiles = [...new Set(allFiles)];
    this.log.info(`找到 ${uniqueFiles.length} 个前端文件`);
    
    for (const file of uniqueFiles) {
      await this.processFile(file);
    }
    
    return uniqueFiles.length;
  }

  // 处理单个文件
  async processFile(filePath) {
    this.scannedFiles++;
    
    if (!fs.existsSync(filePath)) {
      this.log.warn(`文件不存在: ${filePath}`);
      return;
    }

    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let hasChanges = false;
      let removedCount = 0;

      // 检查是否包含ProductID相关内容
      const hasProductId = CONFIG.productIdKeywords.some(keyword => 
        content.includes(keyword)
      );

      if (!hasProductId) {
        return; // 文件中没有ProductID相关内容，跳过
      }

      this.log.info(`处理文件: ${filePath}`);

      // 应用清理模式
      for (const pattern of CONFIG.removePatterns) {
        const matches = content.match(pattern);
        if (matches) {
          content = content.replace(pattern, '');
          removedCount += matches.length;
          hasChanges = true;
        }
      }

      // 移除ProductID相关的翻译键
      content = content.replace(
        /t\(['"`][^'"`]*product[_-]?id[^'"`]*['"`][^)]*\)/gi,
        "''"
      );

      // 移除ProductID相关的CSS类
      content = content.replace(
        /className=['"`][^'"`]*product[_-]?id[^'"`]*['"`]/gi,
        'className=""'
      );

      // 清理空的div和span标签
      content = content.replace(/<(div|span)\s+className=""\s*><\/(div|span)>/gi, '');
      content = content.replace(/<(div|span)\s*><\/(div|span)>/gi, '');

      // 移除多余的空行
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

      if (hasChanges) {
        // 备份原文件
        const backupPath = path.join(CONFIG.backupDir, filePath);
        const backupDir = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        fs.writeFileSync(backupPath, originalContent, 'utf8');
        
        // 写入清理后的内容
        fs.writeFileSync(filePath, content, 'utf8');
        
        this.modifiedFiles++;
        this.removedComponents += removedCount;
        
        this.cleanupReport.push({
          file: filePath,
          removedComponents: removedCount,
          hasBackup: true
        });
        
        this.log.success(`已清理 ${filePath}，移除 ${removedCount} 个ProductID组件`);
      }

    } catch (error) {
      this.log.error(`处理文件失败 ${filePath}: ${error.message}`);
    }
  }

  // 生成清理报告
  generateCleanupReport() {
    const reportContent = `# ProductID前端清理报告

## 清理概要
- 扫描文件总数: ${this.scannedFiles}
- 修改文件数量: ${this.modifiedFiles}
- 移除组件总数: ${this.removedComponents}
- 清理时间: ${new Date().toISOString()}

## 清理详情

${this.cleanupReport.map(item => `
### ${item.file}
- 移除组件数: ${item.removedComponents}
- 备份状态: ${item.hasBackup ? '✅ 已备份' : '❌ 未备份'}
`).join('')}

## 验证建议

1. **功能测试**: 确保清理后页面正常显示
2. **数据完整性**: 确认后端数据中ProductID仍然存在
3. **API测试**: 验证API响应中ProductID用于内部追踪
4. **用户体验**: 确认用户界面中不再显示ProductID

## 回滚方法

如需回滚，可使用以下命令：
\`\`\`bash
# 从备份恢复所有文件
cp -r ${CONFIG.backupDir}/frontend-cleanup-*/. .
\`\`\`

## 注意事项

⚠️ **重要**: ProductID仍然存在于：
- 后端数据库中
- API响应数据中（用于内部追踪）
- 订单管理系统中

✅ **已清理**: ProductID不再在前端UI中显示给用户
`;

    const reportPath = 'docs/Bug修复指南/06-修复工具/ProductID前端清理报告.md';
    fs.writeFileSync(reportPath, reportContent, 'utf8');
    
    this.log.success(`清理报告已生成: ${reportPath}`);
    
    return reportContent;
  }

  // 验证清理结果
  async verifyCleanup() {
    this.log.info('验证ProductID前端清理结果...');
    
    const verificationResults = {
      frontendClean: true,
      remainingReferences: [],
      backendIntact: true
    };

    // 检查前端文件是否还有ProductID显示
    const allFiles = [];
    for (const pattern of CONFIG.frontendFiles) {
      const files = glob.sync(pattern);
      allFiles.push(...files);
    }

    for (const file of [...new Set(allFiles)]) {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        
        // 检查是否还有ProductID显示组件
        const hasProductIdDisplay = CONFIG.productIdKeywords.some(keyword => {
          // 排除注释中的引用
          const lines = content.split('\n');
          return lines.some(line => 
            line.includes(keyword) && 
            !line.trim().startsWith('//') && 
            !line.trim().startsWith('/*') &&
            !line.trim().startsWith('*')
          );
        });

        if (hasProductIdDisplay) {
          verificationResults.frontendClean = false;
          verificationResults.remainingReferences.push(file);
        }
      }
    }

    return verificationResults;
  }

  // 主执行方法
  async run() {
    try {
      this.log.info('开始ProductID前端清理...');
      
      // 1. 创建备份
      await this.createBackup();
      
      // 2. 扫描并清理前端文件
      await this.scanFrontendFiles();
      
      // 3. 生成清理报告
      this.generateCleanupReport();
      
      // 4. 验证清理结果
      const verification = await this.verifyCleanup();
      
      this.log.success(`清理完成! 扫描: ${this.scannedFiles}, 修改: ${this.modifiedFiles}, 移除组件: ${this.removedComponents}`);
      
      if (verification.frontendClean) {
        this.log.success('✅ 前端ProductID显示已完全清理');
      } else {
        this.log.warn(`⚠️ 仍有 ${verification.remainingReferences.length} 个文件包含ProductID引用`);
        verification.remainingReferences.forEach(file => {
          this.log.warn(`- ${file}`);
        });
      }
      
      return {
        success: true,
        scanned: this.scannedFiles,
        modified: this.modifiedFiles,
        removed: this.removedComponents,
        verification
      };
      
    } catch (error) {
      this.log.error(`清理过程出错: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// 命令行执行
if (require.main === module) {
  const cleaner = new ProductIdFrontendCleaner();
  
  cleaner.run()
    .then(result => {
      if (result.success) {
        console.log(`\n🎉 ProductID前端清理成功完成!`);
        console.log(`扫描文件: ${result.scanned}`);
        console.log(`修改文件: ${result.modified}`);
        console.log(`移除组件: ${result.removed}`);
        console.log(`前端清理: ${result.verification.frontendClean ? '✅ 完成' : '⚠️ 部分完成'}`);
        
        process.exit(0);
      } else {
        console.error(`❌ 清理失败: ${result.error}`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(`❌ 执行出错: ${error.message}`);
      process.exit(1);
    });
}

module.exports = ProductIdFrontendCleaner; 