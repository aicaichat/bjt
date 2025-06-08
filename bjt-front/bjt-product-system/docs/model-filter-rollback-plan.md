# Model筛选功能回滚计划和容错机制

## 🔄 **回滚策略概述**

### **回滚触发条件**
1. **功能测试失败** - 任何核心功能测试未通过
2. **性能下降** - 筛选响应时间超过100ms
3. **数据准确性问题** - 筛选结果与预期不符
4. **用户体验异常** - 界面卡顿或错误
5. **系统稳定性问题** - 连续错误或崩溃

### **回滚级别**
- **Level 1**: 功能降级 - 禁用新功能，保持原功能
- **Level 2**: 缓存清除 - 清理相关缓存和状态
- **Level 3**: 完全回滚 - 恢复到修复前状态
- **Level 4**: 紧急恢复 - 重载页面或重启服务

## 🛡️ **自动回滚机制**

### **智能监控和自动触发**
```typescript
class AutoRollbackMonitor {
  constructor() {
    this.healthMetrics = {
      errorCount: 0,
      avgResponseTime: 0,
      lastTestResult: null,
      consecutiveFailures: 0
    };
    
    this.thresholds = {
      maxErrors: 3,           // 3个错误触发回滚
      maxResponseTime: 100,   // 100ms超时触发回滚
      maxConsecutiveFailures: 2 // 连续2次失败触发回滚
    };
    
    this.rollbackHistory = [];
    this.monitoringActive = false;
  }
  
  startMonitoring() {
    this.monitoringActive = true;
    
    // 每10秒执行健康检查
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 10000);
    
    // 监听错误事件
    window.addEventListener('error', (error) => {
      this.handleError(error);
    });
    
    // 监听性能问题
    this.setupPerformanceMonitoring();
    
    console.log("📊 自动回滚监控已启动");
  }
  
  performHealthCheck() {
    try {
      const startTime = performance.now();
      
      // 快速功能测试
      const testModel = 'LA-E4C';
      const result = window.ModelFilterFix?.createOptimizedFilter?.filterByModel(
        getAllConsumables(), 
        testModel
      );
      
      const responseTime = performance.now() - startTime;
      this.healthMetrics.avgResponseTime = responseTime;
      
      // 检查结果准确性
      const expectedCount = 37; // LA-E4C预期数量
      const isAccurate = result && result.length === expectedCount;
      
      if (!isAccurate || responseTime > this.thresholds.maxResponseTime) {
        this.handleHealthCheckFailure(responseTime, isAccurate);
      } else {
        // 健康检查通过，重置失败计数
        this.healthMetrics.consecutiveFailures = 0;
      }
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  handleHealthCheckFailure(responseTime, isAccurate) {
    this.healthMetrics.consecutiveFailures++;
    
    const issue = {
      timestamp: new Date().toISOString(),
      type: !isAccurate ? 'accuracy_issue' : 'performance_issue',
      responseTime,
      isAccurate,
      consecutiveFailures: this.healthMetrics.consecutiveFailures
    };
    
    console.warn("⚠️ 健康检查失败:", issue);
    
    // 达到阈值时触发自动回滚
    if (this.healthMetrics.consecutiveFailures >= this.thresholds.maxConsecutiveFailures) {
      this.triggerAutoRollback('health_check_failed', issue);
    }
  }
  
  handleError(error) {
    this.healthMetrics.errorCount++;
    
    console.error("❌ 检测到错误:", error);
    
    // 错误数量超过阈值时触发回滚
    if (this.healthMetrics.errorCount >= this.thresholds.maxErrors) {
      this.triggerAutoRollback('error_threshold_exceeded', {
        errorCount: this.healthMetrics.errorCount,
        lastError: error.message || error
      });
    }
  }
  
  triggerAutoRollback(reason, details) {
    console.log(`🔄 触发自动回滚 - 原因: ${reason}`);
    
    const rollbackRecord = {
      timestamp: new Date().toISOString(),
      reason,
      details,
      level: this.determineRollbackLevel(reason, details)
    };
    
    this.rollbackHistory.push(rollbackRecord);
    
    // 执行回滚
    this.executeRollback(rollbackRecord.level, rollbackRecord);
  }
  
  determineRollbackLevel(reason, details) {
    // 根据问题严重程度确定回滚级别
    if (reason === 'error_threshold_exceeded') {
      return 3; // 完全回滚
    } else if (reason === 'health_check_failed' && !details.isAccurate) {
      return 2; // 缓存清除
    } else if (details.responseTime > 200) {
      return 3; // 性能严重问题，完全回滚
    } else {
      return 1; // 功能降级
    }
  }
  
  executeRollback(level, record) {
    try {
      switch (level) {
        case 1:
          this.level1Rollback();
          break;
        case 2:
          this.level2Rollback();
          break;
        case 3:
          this.level3Rollback();
          break;
        case 4:
          this.level4Rollback();
          break;
      }
      
      console.log(`✅ Level ${level} 回滚执行完成`);
      
    } catch (error) {
      console.error(`❌ Level ${level} 回滚失败:`, error);
      
      // 回滚失败，升级到更高级别
      if (level < 4) {
        this.executeRollback(level + 1, record);
      }
    }
  }
}
```

### **分级回滚实现**

```typescript
// Level 1: 功能降级
level1Rollback() {
  console.log("🔄 执行 Level 1 回滚 - 功能降级");
  
  // 禁用优化功能，使用基础筛选
  if (window.ModelFilterFix) {
    window.ModelFilterFix.useOptimized = false;
    
    // 提供降级的筛选函数
    window.ModelFilterFix.degradedFilter = (items, model) => {
      return items.filter(item => {
        if (!model || model === 'all') return true;
        return item.app_model && item.app_model.includes(model);
      });
    };
  }
  
  // 显示降级通知
  this.showDegradationNotice();
}

// Level 2: 缓存清除
level2Rollback() {
  console.log("🔄 执行 Level 2 回滚 - 缓存清除");
  
  // 清除所有相关缓存
  if (window.ModelFilterFix?.createOptimizedFilter) {
    window.ModelFilterFix.createOptimizedFilter = window.ModelFilterFix.createOptimizedFilter();
  }
  
  // 清除localStorage缓存
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('modelFilter')) {
      localStorage.removeItem(key);
    }
  });
  
  // 重置健康指标
  this.healthMetrics = {
    errorCount: 0,
    avgResponseTime: 0,
    lastTestResult: null,
    consecutiveFailures: 0
  };
  
  console.log("🧹 缓存清除完成");
}

// Level 3: 完全回滚
level3Rollback() {
  console.log("🔄 执行 Level 3 回滚 - 完全回滚");
  
  // 查找最新备份
  const backupKeys = Object.keys(localStorage).filter(key => 
    key.startsWith('modelFilterBackup_')
  );
  
  if (backupKeys.length === 0) {
    console.error("❌ 未找到备份数据，无法执行完全回滚");
    this.level4Rollback();
    return;
  }
  
  // 选择最新备份
  const latestBackupKey = backupKeys.sort().pop();
  const backupData = JSON.parse(localStorage.getItem(latestBackupKey));
  
  if (!backupData) {
    console.error("❌ 备份数据损坏");
    this.level4Rollback();
    return;
  }
  
  // 恢复原始代码
  this.restoreOriginalCode(backupData.originalCode);
  
  // 清除修复相关的全局变量
  delete window.ModelFilterFix;
  
  // 清除所有相关存储
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('modelFilter')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log("✅ 完全回滚完成，已恢复到修复前状态");
}

// Level 4: 紧急恢复
level4Rollback() {
  console.log("🚨 执行 Level 4 回滚 - 紧急恢复");
  
  // 显示紧急恢复通知
  this.showEmergencyNotice();
  
  // 延迟重载页面，给用户看到通知的时间
  setTimeout(() => {
    window.location.reload();
  }, 3000);
}
```

## 🔧 **手动回滚工具**

```typescript
// 手动回滚控制台
const ManualRollbackConsole = {
  // 显示当前状态
  showStatus() {
    console.log("📊 Model筛选功能状态:");
    console.log("修复功能:", window.ModelFilterFix ? "已安装" : "未安装");
    
    if (window.ModelFilterFix) {
      console.log("优化状态:", window.ModelFilterFix.useOptimized !== false ? "启用" : "降级");
    }
    
    // 显示备份信息
    const backups = Object.keys(localStorage).filter(key => 
      key.startsWith('modelFilterBackup_')
    );
    console.log("可用备份:", backups.length);
    backups.forEach(backup => {
      const data = JSON.parse(localStorage.getItem(backup));
      console.log(`  ${backup}: ${data.timestamp}`);
    });
  },
  
  // 手动执行特定级别回滚
  executeRollback(level) {
    const monitor = new AutoRollbackMonitor();
    monitor.executeRollback(level, {
      timestamp: new Date().toISOString(),
      reason: 'manual_trigger',
      details: { level, triggeredBy: 'user' }
    });
  },
  
  // 创建手动备份
  createBackup(description = '手动备份') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      timestamp,
      description,
      originalCode: {
        consumablesPage: document.querySelector('#consumables-page-content')?.innerHTML,
        modelFilterState: window.ModelFilterFix ? JSON.stringify(window.ModelFilterFix) : null
      }
    };
    
    const backupKey = `modelFilterBackup_manual_${timestamp}`;
    localStorage.setItem(backupKey, JSON.stringify(backupData));
    
    console.log(`💾 手动备份创建: ${backupKey}`);
    return backupKey;
  },
  
  // 恢复到指定备份
  restoreFromBackup(backupKey) {
    const backupData = JSON.parse(localStorage.getItem(backupKey));
    if (!backupData) {
      console.error("❌ 备份不存在:", backupKey);
      return false;
    }
    
    console.log(`🔄 恢复备份: ${backupKey}`);
    
    try {
      // 恢复代码
      if (backupData.originalCode.consumablesPage) {
        const targetElement = document.querySelector('#consumables-page-content');
        if (targetElement) {
          targetElement.innerHTML = backupData.originalCode.consumablesPage;
        }
      }
      
      // 清除当前修复状态
      delete window.ModelFilterFix;
      
      console.log("✅ 备份恢复完成");
      return true;
      
    } catch (error) {
      console.error("❌ 备份恢复失败:", error);
      return false;
    }
  },
  
  // 清理旧备份
  cleanupOldBackups(keepCount = 5) {
    const backups = Object.keys(localStorage)
      .filter(key => key.startsWith('modelFilterBackup_'))
      .sort()
      .reverse(); // 最新的在前
    
    if (backups.length <= keepCount) {
      console.log("无需清理备份");
      return;
    }
    
    const toDelete = backups.slice(keepCount);
    toDelete.forEach(backup => {
      localStorage.removeItem(backup);
      console.log(`🗑️ 删除旧备份: ${backup}`);
    });
    
    console.log(`✅ 清理完成，保留 ${keepCount} 个最新备份`);
  }
};
```

## 🚨 **故障恢复流程**

### **故障检测和分类**
```typescript
const TroubleshootingGuide = {
  diagnoseIssue() {
    const issues = [];
    
    // 检查1: 基础功能可用性
    if (!window.ModelFilterFix) {
      issues.push({
        type: 'missing_fix',
        severity: 'high',
        description: 'ModelFilterFix未安装或已损坏',
        solution: 'level3Rollback'
      });
    }
    
    // 检查2: 性能问题
    const performanceTest = this.quickPerformanceTest();
    if (performanceTest.avgTime > 100) {
      issues.push({
        type: 'performance_issue',
        severity: 'medium',
        description: `筛选性能过慢: ${performanceTest.avgTime}ms`,
        solution: 'level2Rollback'
      });
    }
    
    // 检查3: 数据准确性
    const accuracyTest = this.quickAccuracyTest();
    if (!accuracyTest.passed) {
      issues.push({
        type: 'accuracy_issue',
        severity: 'high',
        description: '筛选结果不准确',
        details: accuracyTest.details,
        solution: 'level3Rollback'
      });
    }
    
    return issues;
  },
  
  quickPerformanceTest() {
    const times = [];
    const models = ['LA-E4C', 'LA-E4S V2.0'];
    
    models.forEach(model => {
      const start = performance.now();
      try {
        window.ModelFilterFix.createOptimizedFilter.filterByModel(
          getAllConsumables(), 
          model
        );
      } catch (error) {
        times.push(1000); // 错误时记录为很慢
      }
      const end = performance.now();
      times.push(end - start);
    });
    
    return {
      avgTime: times.reduce((a, b) => a + b) / times.length,
      maxTime: Math.max(...times),
      allTimes: times
    };
  },
  
  quickAccuracyTest() {
    try {
      const testCases = [
        { model: 'LA-E4C', expected: 37 },
        { model: 'LA-E5P', expected: 5 }
      ];
      
      const results = testCases.map(test => {
        const filtered = window.ModelFilterFix.createOptimizedFilter.filterByModel(
          getAllConsumables(), 
          test.model
        );
        
        return {
          model: test.model,
          expected: test.expected,
          actual: filtered.length,
          passed: filtered.length === test.expected
        };
      });
      
      return {
        passed: results.every(r => r.passed),
        details: results
      };
      
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  },
  
  autoFix() {
    const issues = this.diagnoseIssue();
    
    if (issues.length === 0) {
      console.log("✅ 未发现问题");
      return { success: true, message: "系统正常" };
    }
    
    console.log(`🔍 发现 ${issues.length} 个问题:`, issues);
    
    // 按严重程度排序并执行最高级别的修复
    const highSeverityIssues = issues.filter(i => i.severity === 'high');
    const targetIssue = highSeverityIssues.length > 0 ? highSeverityIssues[0] : issues[0];
    
    console.log(`🔧 执行自动修复: ${targetIssue.solution}`);
    
    const monitor = new AutoRollbackMonitor();
    const level = parseInt(targetIssue.solution.replace('level', '').replace('Rollback', ''));
    monitor.executeRollback(level, {
      timestamp: new Date().toISOString(),
      reason: 'auto_fix',
      details: targetIssue
    });
    
    return {
      success: true,
      message: `执行了 ${targetIssue.solution}`,
      issues: issues
    };
  }
};
```

## 📋 **回滚操作手册**

### **快速操作命令**
```javascript
// 1. 状态检查
ManualRollbackConsole.showStatus();

// 2. 问题诊断
TroubleshootingGuide.diagnoseIssue();

// 3. 自动修复
TroubleshootingGuide.autoFix();

// 4. 手动回滚
ManualRollbackConsole.executeRollback(3); // Level 3完全回滚

// 5. 创建备份
ManualRollbackConsole.createBackup('修复前备份');

// 6. 恢复备份
ManualRollbackConsole.restoreFromBackup('modelFilterBackup_manual_2024-01-01T12-00-00-000Z');

// 7. 清理备份
ManualRollbackConsole.cleanupOldBackups(5);
```

### **紧急恢复步骤**
1. **立即停止** - 停止所有自动修复进程
2. **状态评估** - 执行 `TroubleshootingGuide.diagnoseIssue()`
3. **选择方案** - 根据问题严重程度选择回滚级别
4. **执行回滚** - 使用 `ManualRollbackConsole.executeRollback(level)`
5. **验证恢复** - 确认功能恢复正常
6. **记录问题** - 保存故障信息用于后续分析

## 🛠️ **预防措施**

### **定期健康检查**
```typescript
// 启用持续监控
const monitor = new AutoRollbackMonitor();
monitor.startMonitoring();

// 每小时执行一次完整检查
setInterval(() => {
  const issues = TroubleshootingGuide.diagnoseIssue();
  if (issues.length > 0) {
    console.warn("定期检查发现问题:", issues);
    // 可选择自动修复或仅报警
  }
}, 3600000); // 1小时
```

### **备份策略**
- **自动备份**: 每次修复前自动创建
- **定期备份**: 每天创建一次手动备份
- **长期保留**: 保留最近5个备份
- **验证备份**: 定期验证备份完整性

这个完整的回滚和容错机制确保了无论何时出现问题，都能快速安全地恢复到稳定状态。 