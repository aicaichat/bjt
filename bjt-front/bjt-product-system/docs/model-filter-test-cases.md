# Model筛选功能详细测试用例

## 📊 **测试数据基准**

基于 `docker/dev/mysql/_耗材.sql` 的实际数据分析：

### **机型分布统计**
```javascript
const expectedModelDistribution = {
  'LA-E4C': {
    count: 37,
    description: '支持LA-E4C的所有耗材',
    includes: ['单独LA-E4C', 'LA-E4C与其他机型组合'],
    samplePartNumbers: ['90R01258', '90R01312', '90R01313', '90R01286', '90R01287']
  },
  'LA-E4S V2.0': {
    count: 40, 
    description: '支持LA-E4S V2.0的所有耗材',
    includes: ['单独"LA-E4S V2.0"', '与LA-E4C组合', '与LA-F2组合'],
    samplePartNumbers: ['90R01258', '90B01033', '90B01087', '90B01080', '90B01264']
  },
  'LA-E5P': {
    count: 5,
    description: '专用于LA-E5P的耗材',
    includes: ['单独LA-E5P机型'],
    samplePartNumbers: ['90S01005', '90S01006', '90R01248', '90R01243', '90S01002']
  },
  'LA-F2': {
    count: 14,
    description: '支持LA-F2的所有耗材',
    includes: ['LA-F2与其他机型组合', 'PAPE材质相关'],
    samplePartNumbers: ['90B01178', '90B01181', '90B01033', '90B01087', '90B01080']
  },
  'LA-E4S(paper)': {
    count: 2,
    description: '纸质专用机型',
    includes: ['纸质材料专用耗材'],
    samplePartNumbers: ['92A01007', '92R01006']
  }
};
```

## 🧪 **功能测试用例**

### **测试用例1：筛选选项生成**
```typescript
const testFilterOptionsGeneration = () => {
  const testCase = {
    id: 'T001',
    name: '筛选选项生成验证',
    objective: '验证能够正确生成所有机型筛选选项',
    
    steps: [
      {
        action: '获取筛选选项',
        code: 'const options = window.ModelFilterFix.getModelOptions(allConsumables)',
        expected: '返回5个机型选项'
      },
      {
        action: '验证选项完整性',
        code: 'const expectedModels = ["LA-E4C", "LA-E4S V2.0", "LA-E5P", "LA-F2", "LA-E4S(paper)"]',
        expected: '所有预期机型都存在'
      },
      {
        action: '验证选项排序',
        code: 'options.forEach((option, index) => console.log(`${index}: ${option}`))',
        expected: '按字母顺序正确排列'
      }
    ],
    
    assertions: [
      'options.length === 5',
      'expectedModels.every(model => options.includes(model))',
      'options.indexOf("LA-E4C") < options.indexOf("LA-E4S V2.0")'
    ]
  };
  
  return testCase;
};
```

### **测试用例2：单机型筛选准确性**
```typescript
const testSingleModelFiltering = () => {
  const generateSingleModelTest = (model, expectedCount, description) => ({
    id: `T002-${model.replace(/[^A-Z0-9]/g, '')}`,
    name: `${model}机型筛选`,
    objective: description,
    
    setup: () => {
      const allItems = getAllConsumables();
      console.log(`测试数据总量: ${allItems.length}`);
    },
    
    execute: () => {
      const startTime = performance.now();
      const filtered = window.ModelFilterFix.createOptimizedFilter.filterByModel(
        getAllConsumables(), 
        model
      );
      const endTime = performance.now();
      
      return {
        results: filtered,
        count: filtered.length,
        responseTime: endTime - startTime,
        partNumbers: filtered.map(item => item.part_number)
      };
    },
    
    validate: (result) => {
      const tests = [
        {
          name: '数量准确性',
          passed: result.count === expectedCount,
          actual: result.count,
          expected: expectedCount
        },
        {
          name: '响应时间',
          passed: result.responseTime < 50,
          actual: `${result.responseTime.toFixed(2)}ms`,
          expected: '< 50ms'
        },
        {
          name: '结果包含性',
          passed: result.results.every(item => {
            const models = window.ModelFilterFix.parseAppModels(item.app_model || '');
            return models.includes(model);
          }),
          actual: '所有结果都包含目标机型',
          expected: '100%匹配'
        }
      ];
      
      return {
        allPassed: tests.every(t => t.passed),
        details: tests
      };
    }
  });
  
  return [
    generateSingleModelTest('LA-E4C', 37, '验证LA-E4C机型筛选准确性'),
    generateSingleModelTest('LA-E4S V2.0', 40, '验证LA-E4S V2.0机型筛选准确性'), 
    generateSingleModelTest('LA-E5P', 5, '验证LA-E5P机型筛选准确性'),
    generateSingleModelTest('LA-F2', 14, '验证LA-F2机型筛选准确性'),
    generateSingleModelTest('LA-E4S(paper)', 2, '验证纸质机型筛选准确性')
  ];
};
```

### **测试用例3：复杂格式解析**
```typescript
const testComplexFormatParsing = () => {
  return {
    id: 'T003',
    name: 'app_model复杂格式解析',
    objective: '验证能够正确解析各种复杂的app_model格式',
    
    testData: [
      {
        input: 'LA-E4C,"LA-E4S V2.0"',
        expected: ['LA-E4C', 'LA-E4S V2.0'],
        description: '逗号+引号组合格式'
      },
      {
        input: '"LA-E4S V2.0",LA-F2',
        expected: ['LA-E4S V2.0', 'LA-F2'],
        description: '引号+逗号组合格式'
      },
      {
        input: 'LA-E5P',
        expected: ['LA-E5P'],
        description: '单一值格式'
      },
      {
        input: '"LA-E4S V2.0"',
        expected: ['LA-E4S V2.0'],
        description: '纯引号包围格式'
      },
      {
        input: 'LA-E4S(paper)',
        expected: ['LA-E4S(paper)'],
        description: '括号特殊标识格式'
      }
    ],
    
    execute: () => {
      const results = [];
      
      testData.forEach(test => {
        const parsed = window.ModelFilterFix.parseAppModels(test.input);
        const passed = JSON.stringify(parsed.sort()) === JSON.stringify(test.expected.sort());
        
        results.push({
          ...test,
          actual: parsed,
          passed
        });
        
        console.log(`${test.description}: ${passed ? '✅' : '❌'}`);
        if (!passed) {
          console.log(`  预期: ${test.expected.join(', ')}`);
          console.log(`  实际: ${parsed.join(', ')}`);
        }
      });
      
      return results;
    }
  };
};
```

### **测试用例4：性能基准测试**
```typescript
const testPerformanceBenchmark = () => {
  return {
    id: 'T004',
    name: '筛选性能基准测试',
    objective: '验证筛选操作满足性能要求',
    
    benchmarks: [
      {
        name: '单次筛选性能',
        target: '< 50ms',
        test: () => {
          const times = [];
          const models = ['LA-E4C', 'LA-E4S V2.0', 'LA-E5P', 'LA-F2', 'LA-E4S(paper)'];
          
          models.forEach(model => {
            const start = performance.now();
            window.ModelFilterFix.createOptimizedFilter.filterByModel(
              getAllConsumables(), 
              model
            );
            const end = performance.now();
            times.push(end - start);
          });
          
          return {
            avgTime: times.reduce((a, b) => a + b) / times.length,
            maxTime: Math.max(...times),
            minTime: Math.min(...times),
            allTimes: times
          };
        }
      },
      {
        name: '批量筛选性能',
        target: '5次筛选总计 < 200ms',
        test: () => {
          const start = performance.now();
          
          ['LA-E4C', 'LA-E4S V2.0', 'LA-E5P', 'LA-F2', 'LA-E4S(paper)'].forEach(model => {
            window.ModelFilterFix.createOptimizedFilter.filterByModel(
              getAllConsumables(), 
              model
            );
          });
          
          const totalTime = performance.now() - start;
          return { totalTime, passed: totalTime < 200 };
        }
      },
      {
        name: '内存使用效率',
        target: '缓存命中率 > 80%',
        test: () => {
          // 清除缓存
          window.ModelFilterFix.createOptimizedFilter = window.ModelFilterFix.createOptimizedFilter();
          
          let cacheHits = 0;
          let totalQueries = 0;
          
          // 执行重复查询测试缓存效果
          const models = ['LA-E4C', 'LA-E4S V2.0'];
          for (let i = 0; i < 10; i++) {
            models.forEach(model => {
              const start = performance.now();
              window.ModelFilterFix.createOptimizedFilter.filterByModel(
                getAllConsumables(), 
                model
              );
              const time = performance.now() - start;
              
              totalQueries++;
              if (time < 5) cacheHits++; // 5ms以内认为是缓存命中
            });
          }
          
          const hitRate = (cacheHits / totalQueries) * 100;
          return { hitRate, passed: hitRate > 80 };
        }
      }
    ]
  };
};
```

### **测试用例5：边界情况处理**
```typescript
const testEdgeCases = () => {
  return {
    id: 'T005',
    name: '边界情况处理测试',
    objective: '验证异常输入和边界情况的处理',
    
    cases: [
      {
        name: '空值处理',
        test: () => {
          const results = [
            window.ModelFilterFix.parseAppModels(null),
            window.ModelFilterFix.parseAppModels(undefined),
            window.ModelFilterFix.parseAppModels(''),
            window.ModelFilterFix.parseAppModels('   ')
          ];
          
          return {
            passed: results.every(r => Array.isArray(r) && r.length === 0),
            results
          };
        }
      },
      {
        name: '无效机型筛选',
        test: () => {
          const invalidModel = 'INVALID-MODEL-XYZ';
          const result = window.ModelFilterFix.createOptimizedFilter.filterByModel(
            getAllConsumables(), 
            invalidModel
          );
          
          return {
            passed: result.length === 0,
            count: result.length
          };
        }
      },
      {
        name: '"all"选项处理',
        test: () => {
          const allItems = getAllConsumables();
          const allResult = window.ModelFilterFix.createOptimizedFilter.filterByModel(
            allItems, 
            'all'
          );
          
          return {
            passed: allResult.length === allItems.length,
            original: allItems.length,
            filtered: allResult.length
          };
        }
      }
    ]
  };
};
```

## 🎯 **集成测试套件**

```typescript
const runCompleteTestSuite = async () => {
  console.log("🧪 开始执行完整测试套件...");
  
  const testSuite = {
    filterOptions: testFilterOptionsGeneration(),
    singleModelFiltering: testSingleModelFiltering(),
    complexParsing: testComplexFormatParsing(),
    performance: testPerformanceBenchmark(),
    edgeCases: testEdgeCases()
  };
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0,
    details: {}
  };
  
  // 执行所有测试
  for (const [category, tests] of Object.entries(testSuite)) {
    console.log(`\n📂 执行 ${category} 测试...`);
    
    const categoryResults = Array.isArray(tests) 
      ? await Promise.all(tests.map(test => executeTest(test)))
      : await executeTest(tests);
    
    results.details[category] = categoryResults;
    
    // 统计结果
    const categoryPassed = Array.isArray(categoryResults)
      ? categoryResults.filter(r => r.passed).length
      : categoryResults.passed ? 1 : 0;
    
    const categoryTotal = Array.isArray(categoryResults)
      ? categoryResults.length
      : 1;
    
    results.passed += categoryPassed;
    results.total += categoryTotal;
    results.failed += categoryTotal - categoryPassed;
    
    console.log(`  ${category}: ${categoryPassed}/${categoryTotal} 通过`);
  }
  
  // 生成测试报告
  const successRate = ((results.passed / results.total) * 100).toFixed(2);
  
  console.log(`\n📊 测试完成:`);
  console.log(`  总计: ${results.total}`);
  console.log(`  通过: ${results.passed}`);
  console.log(`  失败: ${results.failed}`);
  console.log(`  成功率: ${successRate}%`);
  
  const overallSuccess = results.failed === 0;
  console.log(`  整体结果: ${overallSuccess ? '🎉 全部通过' : '❌ 存在失败'}`);
  
  return {
    success: overallSuccess,
    summary: results,
    timestamp: new Date().toISOString()
  };
};

// 辅助函数
const executeTest = async (test) => {
  try {
    console.log(`  🧪 ${test.name}`);
    
    if (test.setup) await test.setup();
    const result = await test.execute();
    const validation = test.validate ? test.validate(result) : { allPassed: true };
    
    return {
      id: test.id,
      name: test.name,
      passed: validation.allPassed,
      result,
      validation,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`    ❌ 测试失败: ${error.message}`);
    return {
      id: test.id,
      name: test.name,
      passed: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
```

## 📋 **测试执行清单**

- [ ] **T001**: 筛选选项生成验证
- [ ] **T002-LAE4C**: LA-E4C机型筛选
- [ ] **T002-LAE4SV20**: LA-E4S V2.0机型筛选  
- [ ] **T002-LAE5P**: LA-E5P机型筛选
- [ ] **T002-LAF2**: LA-F2机型筛选
- [ ] **T002-LAE4SPAPER**: LA-E4S(paper)机型筛选
- [ ] **T003**: 复杂格式解析测试
- [ ] **T004**: 性能基准测试
- [ ] **T005**: 边界情况处理测试

## ✅ **通过标准**

1. **功能正确性**: 所有功能测试100%通过
2. **性能要求**: 平均响应时间 < 50ms
3. **数据准确性**: 筛选结果数量完全匹配预期
4. **异常处理**: 边界情况无错误
5. **用户体验**: 操作流畅无卡顿 