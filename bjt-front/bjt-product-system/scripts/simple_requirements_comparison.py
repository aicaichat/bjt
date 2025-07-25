#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的二期需求对比分析
"""

import json
import os
from datetime import datetime

def simple_comparison():
    """简化的需求对比"""
    old_file = 'output/phase2-requirements/final_workload_analysis.json'
    new_file = 'output/new-requirements-analysis/new_requirements_analysis.json'
    output_dir = 'output/requirements-comparison'
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print("🔍 开始简化需求对比...")
    
    # 读取数据
    with open(old_file, 'r', encoding='utf-8') as f:
        old_data = json.load(f)
    
    with open(new_file, 'r', encoding='utf-8') as f:
        new_data = json.load(f)
    
    # 提取关键数据
    old_summary = old_data['summary']
    new_summary = new_data['summary']
    
    # 生成对比报告
    comparison = {
        'generated_at': datetime.now().isoformat(),
        'summary_comparison': {
            'requirements': {
                'old': old_summary['total_requirements'],
                'new': new_summary['total_requirements'],
                'change': new_summary['total_requirements'] - old_summary['total_requirements']
            },
            'workload': {
                'old': old_summary['total_workload_days'],
                'new': new_summary['total_workload_days'],
                'change': new_summary['total_workload_days'] - old_summary['total_workload_days']
            },
            'timeline': {
                'old': old_summary['estimated_months'],
                'new': new_summary['estimated_months'],
                'change': new_summary['estimated_months'] - old_summary['estimated_months']
            }
        },
        'key_findings': generate_key_findings(old_data, new_data),
        'recommendations': generate_recommendations(old_summary, new_summary)
    }
    
    # 保存对比报告
    comparison_file = os.path.join(output_dir, 'simple_comparison.json')
    with open(comparison_file, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
    
    # 生成Markdown报告
    markdown_report = generate_markdown_report(comparison)
    markdown_file = os.path.join(output_dir, 'simple_comparison.md')
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"✅ 简化对比报告已保存到:")
    print(f"  - JSON: {comparison_file}")
    print(f"  - Markdown: {markdown_file}")

def generate_key_findings(old_data, new_data):
    """生成关键发现"""
    findings = []
    
    # 检查需求数量是否相同
    old_req_count = old_data['summary']['total_requirements']
    new_req_count = new_data['summary']['total_requirements']
    
    if old_req_count == new_req_count:
        findings.append("需求数量保持一致，没有新增或减少需求")
    else:
        findings.append(f"需求数量发生变化：从 {old_req_count} 个变为 {new_req_count} 个")
    
    # 检查工作量是否相同
    old_workload = old_data['summary']['total_workload_days']
    new_workload = new_data['summary']['total_workload_days']
    
    if abs(old_workload - new_workload) < 0.1:
        findings.append("工作量估算保持一致，没有显著变化")
    else:
        findings.append(f"工作量估算发生变化：从 {old_workload} 天变为 {new_workload} 天")
    
    # 检查工期是否相同
    old_months = old_data['summary']['estimated_months']
    new_months = new_data['summary']['estimated_months']
    
    if abs(old_months - new_months) < 0.1:
        findings.append("预计工期保持一致，没有显著变化")
    else:
        findings.append(f"预计工期发生变化：从 {old_months} 个月变为 {new_months} 个月")
    
    return findings

def generate_recommendations(old_summary, new_summary):
    """生成建议"""
    recommendations = []
    
    # 基于变化生成建议
    workload_change = new_summary['total_workload_days'] - old_summary['total_workload_days']
    
    if workload_change > 10:
        recommendations.append("工作量显著增加，建议重新评估项目时间线和资源分配")
        recommendations.append("考虑分阶段实施，优先完成核心功能")
        recommendations.append("可能需要增加开发人员或延长项目周期")
    elif workload_change < -10:
        recommendations.append("工作量显著减少，可以考虑提前完成项目或增加功能范围")
        recommendations.append("可以投入更多时间进行质量优化和测试")
    else:
        recommendations.append("工作量变化不大，可以按原计划执行")
    
    # 通用建议
    recommendations.append("建议定期更新需求分析，确保项目计划的准确性")
    recommendations.append("加强与stakeholders的沟通，及时了解需求变化")
    recommendations.append("建立需求变更管理流程，控制项目风险")
    
    return recommendations

def generate_markdown_report(comparison):
    """生成Markdown报告"""
    summary = comparison['summary_comparison']
    
    md_content = f"""# 二期需求简化对比报告

## 📋 对比概览

- **生成时间**: {comparison['generated_at']}
- **对比范围**: 新旧二期需求文件

## 📊 数据对比

### 需求数量
- **旧文件**: {summary['requirements']['old']} 个
- **新文件**: {summary['requirements']['new']} 个
- **变化**: {summary['requirements']['change']} 个

### 工作量
- **旧文件**: {summary['workload']['old']} 天
- **新文件**: {summary['workload']['new']} 天
- **变化**: {summary['workload']['change']} 天

### 预计工期
- **旧文件**: {summary['timeline']['old']} 个月
- **新文件**: {summary['timeline']['new']} 个月
- **变化**: {summary['timeline']['change']} 个月

## 🔍 关键发现

"""
    
    for finding in comparison['key_findings']:
        md_content += f"- {finding}\n"
    
    md_content += """
## 💡 建议

"""
    
    for recommendation in comparison['recommendations']:
        md_content += f"- {recommendation}\n"
    
    md_content += f"""

## 📈 变化分析

### 需求数量变化
- **变化量**: {summary['requirements']['change']} 个
- **变化率**: {round(summary['requirements']['change'] / summary['requirements']['old'] * 100, 1)}%

### 工作量变化
- **变化量**: {summary['workload']['change']} 天
- **变化率**: {round(summary['workload']['change'] / summary['workload']['old'] * 100, 1)}%

### 工期变化
- **变化量**: {summary['timeline']['change']} 个月
- **变化率**: {round(summary['timeline']['change'] / summary['timeline']['old'] * 100, 1)}%

## 🎯 结论

"""
    
    if abs(summary['workload']['change']) < 1:
        md_content += "新旧需求文件基本一致，可以按原计划执行项目。\n"
    elif summary['workload']['change'] > 0:
        md_content += "新需求文件显示工作量增加，需要重新评估项目计划。\n"
    else:
        md_content += "新需求文件显示工作量减少，可以考虑优化项目计划。\n"
    
    md_content += f"""
---
*报告生成时间: {comparison['generated_at']}*
"""
    
    return md_content

if __name__ == "__main__":
    simple_comparison()
    print("🎉 简化需求对比完成！") 