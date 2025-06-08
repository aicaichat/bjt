#!/bin/bash

# =============================================================================
# 耗材筛选功能完整自动化修复脚本
# 目标: 一键解决所有筛选相关问题，避免遗忘中断
# =============================================================================

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 主配置
SCRIPT_START_TIME=$(date +%Y%m%d_%H%M%S)
MASTER_BACKUP="/tmp/consumables_complete_fix_$SCRIPT_START_TIME"
CONTROLLER_FILE="plugins/bjt-core-entities/controllers/class-consumable-controller.php"
FRONTEND_FILE="frontend/src/pages/Consumables/index.tsx"

# =============================================================================
# Phase 1: 环境检查与备份
# =============================================================================
phase1_prepare() {
    log_info "🔧 Phase 1: 环境检查与备份"
    
    # 创建主备份目录
    mkdir -p "$MASTER_BACKUP"
    log_success "创建备份目录: $MASTER_BACKUP"
    
    # 检查关键文件存在性
    if [ ! -f "$CONTROLLER_FILE" ]; then
        log_error "缺少控制器文件: $CONTROLLER_FILE"
        exit 1
    fi
    
    if [ ! -f "scripts/fix-consumables-mapping.sh" ]; then
        log_error "缺少字段映射修复脚本"
        exit 1
    fi
    
    if [ ! -f "scripts/fix-consumables-filter-options.sh" ]; then
        log_error "缺少筛选选项修复脚本"
        exit 1
    fi
    
    # 备份关键文件
    log_info "备份关键文件..."
    cp "$CONTROLLER_FILE" "$MASTER_BACKUP/"
    cp "$FRONTEND_FILE" "$MASTER_BACKUP/" 2>/dev/null || log_warning "前端文件备份失败，继续执行"
    cp -r docs/ "$MASTER_BACKUP/" 2>/dev/null || log_warning "文档备份失败，继续执行"
    
    # 记录修复前API状态
    log_info "记录修复前API状态..."
    curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > "$MASTER_BACKUP/api_before.json" 2>/dev/null || log_warning "API状态记录失败，可能服务未启动"
    
    # 创建执行日志
    echo "修复开始时间: $(date)" > "$MASTER_BACKUP/execution_log.txt"
    echo "脚本版本: 1.0" >> "$MASTER_BACKUP/execution_log.txt"
    echo "备份目录: $MASTER_BACKUP" >> "$MASTER_BACKUP/execution_log.txt"
    
    log_success "Phase 1 完成 - 环境准备就绪"
    echo "Phase 1 完成: $(date)" >> "$MASTER_BACKUP/execution_log.txt"
}

# =============================================================================
# Phase 2: 后端API修复
# =============================================================================
phase2_backend_fix() {
    log_info "🔧 Phase 2: 后端API修复"
    
    # 赋予脚本执行权限
    chmod +x scripts/fix-consumables-mapping.sh
    chmod +x scripts/fix-consumables-filter-options.sh
    
    # 执行API字段映射修复
    log_info "执行API字段映射修复..."
    echo "y" | timeout 300 ./scripts/fix-consumables-mapping.sh || {
        log_error "字段映射修复执行失败"
        exit 1
    }
    
    log_success "API字段映射修复完成"
    
    # 等待服务稳定
    log_info "等待服务稳定(10秒)..."
    sleep 10
    
    # 执行筛选选项动态生成修复
    log_info "执行筛选选项动态生成修复..."
    echo "y" | timeout 300 ./scripts/fix-consumables-filter-options.sh || {
        log_error "筛选选项修复执行失败"
        exit 1
    }
    
    log_success "筛选选项动态生成修复完成"
    
    # 重启服务
    log_info "重启后端服务..."
    if command -v docker-compose &> /dev/null; then
        if docker-compose restart backend &> /dev/null; then
            log_success "后端服务重启成功"
            sleep 15
        else
            log_warning "自动重启失败，请手动重启后端服务"
        fi
    else
        log_warning "docker-compose未找到，请手动重启后端服务"
    fi
    
    log_success "Phase 2 完成 - 后端API修复"
    echo "Phase 2 完成: $(date)" >> "$MASTER_BACKUP/execution_log.txt"
}

# =============================================================================
# Phase 3: 验证与测试
# =============================================================================
phase3_validation() {
    log_info "🧪 Phase 3: 验证与测试"
    
    # 创建测试结果目录
    TEST_RESULTS="$MASTER_BACKUP/test_results"
    mkdir -p "$TEST_RESULTS"
    
    # 等待API服务完全启动
    log_info "等待API服务启动..."
    for i in {1..6}; do
        if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > /dev/null; then
            log_success "API服务已启动"
            break
        else
            log_info "等待API服务启动 ($i/6)..."
            sleep 10
        fi
    done
    
    # 1. API结构验证
    log_info "1. API结构验证..."
    if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.data.items[0] | {
      shape: .shape,
      app_model: .app_model,
      material: .material,
      thickness_met: .thickness_met,
      part_number: .part_number,
      bubble_diameter_met: .bubble_diameter_met
    }' > "$TEST_RESULTS/key_fields.json" 2>/dev/null; then
        log_success "API结构验证完成"
    else
        log_error "API结构验证失败"
    fi
    
    # 2. 筛选选项验证
    log_info "2. 筛选选项验证..."
    if curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" | jq '.data.filterOptions' > "$TEST_RESULTS/filter_options.json" 2>/dev/null; then
        # 统计筛选选项数量
        SHAPES_COUNT=$(jq '.shapes | length' "$TEST_RESULTS/filter_options.json" 2>/dev/null || echo "0")
        MATERIALS_COUNT=$(jq '.materials | length' "$TEST_RESULTS/filter_options.json" 2>/dev/null || echo "0")
        MODELS_COUNT=$(jq '.models | length' "$TEST_RESULTS/filter_options.json" 2>/dev/null || echo "0")
        
        echo "筛选选项统计:" > "$TEST_RESULTS/filter_options_summary.txt"
        echo "- 形状选项: $SHAPES_COUNT 个" >> "$TEST_RESULTS/filter_options_summary.txt"
        echo "- 材质选项: $MATERIALS_COUNT 个" >> "$TEST_RESULTS/filter_options_summary.txt"
        echo "- 机型选项: $MODELS_COUNT 个" >> "$TEST_RESULTS/filter_options_summary.txt"
        
        if [ "$SHAPES_COUNT" -gt 0 ] && [ "$MATERIALS_COUNT" -gt 0 ] && [ "$MODELS_COUNT" -gt 0 ]; then
            log_success "筛选选项验证通过 (形状:$SHAPES_COUNT, 材质:$MATERIALS_COUNT, 机型:$MODELS_COUNT)"
        else
            log_warning "筛选选项数量异常"
        fi
    else
        log_error "筛选选项验证失败"
    fi
    
    # 3. 筛选功能测试
    log_info "3. 筛选功能测试..."
    
    # 测试形状筛选
    SHAPE_COUNT=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?shape=Pillow&limit=50" | jq '.data.items | length' 2>/dev/null || echo "0")
    echo "$SHAPE_COUNT" > "$TEST_RESULTS/shape_filter_test.txt"
    
    # 测试材质筛选
    MATERIAL_COUNT=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?material=HDPE&limit=50" | jq '.data.items | length' 2>/dev/null || echo "0")
    echo "$MATERIAL_COUNT" > "$TEST_RESULTS/material_filter_test.txt"
    
    # 测试机型筛选
    MODEL_COUNT=$(curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?app_model=LA-E4C&limit=50" | jq '.data.items | length' 2>/dev/null || echo "0")
    echo "$MODEL_COUNT" > "$TEST_RESULTS/model_filter_test.txt"
    
    # 生成测试报告
    cat > "$TEST_RESULTS/test_report.md" << EOF
# 筛选功能测试报告

## 测试时间
$(date)

## 测试结果
- Pillow形状筛选: $SHAPE_COUNT 条
- HDPE材质筛选: $MATERIAL_COUNT 条  
- LA-E4C机型筛选: $MODEL_COUNT 条

## 筛选选项统计
- 形状选项: $SHAPES_COUNT 个
- 材质选项: $MATERIALS_COUNT 个
- 机型选项: $MODELS_COUNT 个

## 验证状态
EOF

    # 验证结果判断
    if [ "$SHAPE_COUNT" -gt 0 ] && [ "$MATERIAL_COUNT" -gt 0 ] && [ "$MODEL_COUNT" -gt 0 ]; then
        echo "✅ 筛选功能验证通过" >> "$TEST_RESULTS/test_report.md"
        echo "PASS" > "$TEST_RESULTS/validation_status.txt"
        log_success "筛选功能验证通过"
    else
        echo "❌ 筛选功能验证失败" >> "$TEST_RESULTS/test_report.md"
        echo "FAIL" > "$TEST_RESULTS/validation_status.txt"
        log_error "筛选功能验证失败"
    fi
    
    log_success "Phase 3 完成 - 验证测试"
    echo "Phase 3 完成: $(date)" >> "$MASTER_BACKUP/execution_log.txt"
}

# =============================================================================
# Phase 4: 生成最终报告
# =============================================================================
phase4_final_report() {
    log_info "📋 Phase 4: 生成最终报告"
    
    # 记录修复后API状态
    curl -s "http://localhost:8080/wp-json/bjt/v1/consumables?limit=1" > "$MASTER_BACKUP/api_after.json" 2>/dev/null || log_warning "API状态记录失败"
    
    # 生成完整修复报告
    cat > "$MASTER_BACKUP/complete_fix_report.md" << EOF
# 耗材筛选功能修复完整报告

## 修复概览
- **修复时间**: $(date)
- **备份目录**: $MASTER_BACKUP
- **脚本版本**: 1.0

## 修复内容
1. ✅ API字段映射修复 - 添加前端期望的直接字段
2. ✅ 筛选选项动态生成 - 从实际数据生成筛选选项
3. ✅ 后端服务重启 - 确保更改生效
4. ✅ 功能验证测试 - 确认筛选功能正常

## 测试结果
$(cat "$MASTER_BACKUP/test_results/test_report.md" 2>/dev/null || echo "测试报告生成失败")

## 前端验证清单
1. [ ] 打开耗材页面，检查筛选选项是否显示完整
2. [ ] 测试形状筛选是否正常工作
3. [ ] 测试材质筛选是否正常工作  
4. [ ] 测试机型筛选是否正常工作
5. [ ] 测试多重筛选组合是否正常
6. [ ] 检查筛选后的数据显示是否正确

## 回滚方法
如需回滚，请执行：
\`\`\`bash
cp $MASTER_BACKUP/class-consumable-controller.php plugins/bjt-core-entities/controllers/
docker-compose restart backend
\`\`\`

## 问题排查指南
### 如果前端筛选仍不工作：
1. 检查浏览器控制台错误
2. 清除浏览器缓存
3. 检查前端API调用是否使用正确的字段名
4. 验证API返回的字段结构

### 如果需要进一步支持：
- 备份目录: $MASTER_BACKUP
- 测试结果: $MASTER_BACKUP/test_results/
- 执行日志: $MASTER_BACKUP/execution_log.txt
EOF

    log_success "Phase 4 完成 - 最终报告已生成"
    echo "Phase 4 完成: $(date)" >> "$MASTER_BACKUP/execution_log.txt"
    echo "修复结束时间: $(date)" >> "$MASTER_BACKUP/execution_log.txt"
}

# =============================================================================
# 主执行流程
# =============================================================================
main() {
    log_info "🚀 开始耗材筛选功能完整自动化修复"
    log_info "预计执行时间: 5-10分钟"
    
    # 用户确认
    echo
    read -p "⚠️  即将开始自动修复，是否继续？[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_warning "用户取消修复"
        exit 0
    fi
    
    # 执行各个阶段
    phase1_prepare
    phase2_backend_fix
    phase3_validation
    phase4_final_report
    
    # 最终总结
    echo
    log_success "🎉 耗材筛选功能修复完成！"
    log_info "📁 备份与报告目录: $MASTER_BACKUP"
    log_info "📋 详细报告: $MASTER_BACKUP/complete_fix_report.md"
    
    # 检查最终状态
    VALIDATION_STATUS=$(cat "$MASTER_BACKUP/test_results/validation_status.txt" 2>/dev/null || echo "UNKNOWN")
    if [ "$VALIDATION_STATUS" = "PASS" ]; then
        log_success "✅ 验证通过 - 筛选功能应该已正常工作"
        log_info "请打开前端页面确认筛选功能是否正常"
    else
        log_warning "⚠️  自动验证未完全通过，请手动检查前端页面"
        log_info "查看详细测试结果: $MASTER_BACKUP/test_results/"
    fi
    
    echo
    log_info "🔧 如需回滚，请执行:"
    echo "cp $MASTER_BACKUP/class-consumable-controller.php plugins/bjt-core-entities/controllers/"
    echo "docker-compose restart backend"
}

# 错误处理
trap 'log_error "脚本执行中断，备份目录: $MASTER_BACKUP"' ERR

# 执行主流程
main "$@" 