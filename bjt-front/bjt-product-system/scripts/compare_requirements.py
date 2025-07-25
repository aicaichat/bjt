#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对比新旧二期需求文件的差异
"""

import json
import os
from datetime import datetime

def compare_requirements():
    """对比新旧需求文件"""
    old_file = 'output/phase2-requirements/final_workload_analysis.json'
    new_file = 'output/new-requirements-analysis/new_requirements_analysis.json'
    output_dir = 'output/requirements-comparison'
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print("🔍 开始对比新旧需求文件...")
    
    # 读取旧需求数据
    if os.path.exists(old_file):
        with open(old_file, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
        print("✅ 成功读取旧需求数据")
    else:
        print("❌ 未找到旧需求数据文件")
        return
    
    # 读取新需求数据
    if os.path.exists(new_file):
        with open(new_file, 'r', encoding='utf-8') as f:
            new_data = json.load(f)
        print("✅ 成功读取新需求数据")
    else:
        print("❌ 未找到新需求数据文件")
        return
    
    # 生成对比报告
    comparison = generate_comparison_report(old_data, new_data)
    
    # 保存对比报告
    comparison_file = os.path.join(output_dir, 'requirements_comparison.json')
    with open(comparison_file, 'w', encoding='utf-8') as f:
        json.dump(comparison, f, ensure_ascii=False, indent=2)
    
    # 生成Markdown对比报告
    markdown_comparison = generate_markdown_comparison(comparison)
    markdown_file = os.path.join(output_dir, 'requirements_comparison.md')
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write(markdown_comparison)
    
    print(f"✅ 对比报告已保存到:")
    print(f"  - JSON: {comparison_file}")
    print(f"  - Markdown: {markdown_file}")

def generate_comparison_report(old_data, new_data):
    """生成对比报告"""
    comparison = {
        'generated_at': datetime.now().isoformat(),
        'summary': {
            'old_requirements': old_data['summary']['total_requirements'],
            'new_requirements': new_data['summary']['total_requirements'],
            'old_workload': old_data['summary']['total_workload_days'],
            'new_workload': new_data['summary']['total_workload_days'],
            'old_months': old_data['summary']['estimated_months'],
            'new_months': new_data['summary']['estimated_months']
        },
        'changes': {
            'requirements_change': new_data['summary']['total_requirements'] - old_data['summary']['total_requirements'],
            'workload_change': new_data['summary']['total_workload_days'] - old_data['summary']['total_workload_days'],
            'months_change': new_data['summary']['estimated_months'] - old_data['summary']['estimated_months']
        },
        'detailed_comparison': compare_detailed_data(old_data, new_data),
        'impact_analysis': analyze_impact(old_data, new_data)
    }
    
    return comparison

def compare_detailed_data(old_data, new_data):
    """详细对比数据"""
    comparison = {
        'systems': {},
        'categories': {},
        'priorities': {},
        'types': {}
    }
    
    # 对比系统数据
    old_systems = old_data.get('workload_analysis', {}).get('by_system', {})
    new_systems = new_data.get('systems_analysis', {})
    
    all_systems = set(old_systems.keys()) | set(new_systems.keys())
    
    for system in all_systems:
        old_workload = old_systems.get(system, {}).get('total_days', 0)
        new_workload = new_systems.get(system, {}).get('estimated_workload', 0)
        
        # 确保数据类型为数值
        old_workload = float(old_workload) if old_workload is not None else 0
        new_workload = float(new_workload) if new_workload is not None else 0
        
        comparison['systems'][system] = {
            'old_workload': old_workload,
            'new_workload': new_workload,
            'change': new_workload - old_workload,
            'change_percentage': round((new_workload - old_workload) / old_workload * 100, 1) if old_workload > 0 else 0
        }
    
    # 对比分类数据
    old_categories = old_data.get('workload_analysis', {}).get('by_category', {}).get('categories', {})
    new_categories = new_data.get('categories_analysis', {})
    
    all_categories = set(old_categories.keys()) | set(new_categories.keys())
    
    for category in all_categories:
        old_days = old_categories.get(category, 0)
        new_days = new_categories.get(category, {}).get('days', 0)
        
        # 确保数据类型为数值
        old_days = float(old_days) if old_days is not None else 0
        new_days = float(new_days) if new_days is not None else 0
        
        comparison['categories'][category] = {
            'old_days': old_days,
            'new_days': new_days,
            'change': new_days - old_days,
            'change_percentage': round((new_days - old_days) / old_days * 100, 1) if old_days > 0 else 0
        }
    
    # 对比优先级数据
    old_priorities = old_data.get('workload_analysis', {}).get('by_priority', {})
    new_priorities = new_data.get('priorities_analysis', {})
    
    all_priorities = set(old_priorities.keys()) | set(new_priorities.keys())
    
    for priority in all_priorities:
        old_days = old_priorities.get(priority, 0)
        new_days = new_priorities.get(priority, 0)
        
        # 确保数据类型为数值
        old_days = float(old_days) if old_days is not None else 0
        new_days = float(new_days) if new_days is not None else 0
        
        comparison['priorities'][priority] = {
            'old_days': old_days,
            'new_days': new_days,
            'change': new_days - old_days,
            'change_percentage': round((new_days - old_days) / old_days * 100, 1) if old_days > 0 else 0
        }
    
    # 对比类型数据
    old_types = old_data.get('workload_analysis', {}).get('by_type', {})
    new_types = new_data.get('types_analysis', {})
    
    all_types = set(old_types.keys()) | set(new_types.keys())
    
    for req_type in all_types:
        old_days = old_types.get(req_type, 0)
        new_days = new_types.get(req_type, 0)
        
        # 确保数据类型为数值
        old_days = float(old_days) if old_days is not None else 0
        new_days = float(new_days) if new_days is not None else 0
        
        comparison['types'][req_type] = {
            'old_days': old_days,
            'new_days': new_days,
            'change': new_days - old_days,
            'change_percentage': round((new_days - old_days) / old_days * 100, 1) if old_days > 0 else 0
        }
    
    return comparison

def analyze_impact(old_data, new_data):
    """分析影响"""
    old_workload = old_data['summary']['total_workload_days']
    new_workload = new_data['summary']['total_workload_days']
    workload_change = new_workload - old_workload
    
    impact = {
        'workload_impact': {
            'change': workload_change,
            'change_percentage': round(workload_change / old_workload * 100, 1) if old_workload > 0 else 0,
            'severity': 'high' if abs(workload_change) > 20 else 'medium' if abs(workload_change) > 10 else 'low'
        },
        'timeline_impact': {
            'old_months': old_data['summary']['estimated_months'],
            'new_months': new_data['summary']['estimated_months'],
            'months_change': new_data['summary']['estimated_months'] - old_data['summary']['estimated_months']
        },
        'resource_impact': {
            'old_team_size': '5-7人' if old_workload > 100 else '4-5人' if old_workload > 50 else '3-4人',
            'new_team_size': '5-7人' if new_workload > 100 else '4-5人' if new_workload > 50 else '3-4人',
            'team_size_change': '需要增加' if new_workload > old_workload + 20 else '需要减少' if new_workload < old_workload - 20 else '基本不变'
        },
        'cost_impact': {
            'old_cost': old_workload * 7800,  # 假设每天7800元
            'new_cost': new_workload * 7800,
            'cost_change': (new_workload - old_workload) * 7800,
            'cost_change_percentage': round((new_workload - old_workload) / old_workload * 100, 1) if old_workload > 0 else 0
        }
    }
    
    return impact

def generate_markdown_comparison(comparison):
    """生成Markdown格式的对比报告"""
    md_content = f"""# 二期需求文件对比分析报告

## 📋 对比概览

- **生成时间**: {comparison['generated_at']}
- **旧需求数**: {comparison['summary']['old_requirements']} 个
- **新需求数**: {comparison['summary']['new_requirements']} 个
- **需求变化**: {comparison['changes']['requirements_change']} 个
- **旧工作量**: {comparison['summary']['old_workload']} 天
- **新工作量**: {comparison['summary']['new_workload']} 天
- **工作量变化**: {comparison['changes']['workload_change']} 天
- **旧工期**: {comparison['summary']['old_months']} 个月
- **新工期**: {comparison['summary']['new_months']} 个月
- **工期变化**: {comparison['changes']['months_change']} 个月

## 📊 变化分析

### 需求数量变化
- **变化量**: {comparison['changes']['requirements_change']} 个
- **变化率**: {round(comparison['changes']['requirements_change'] / comparison['summary']['old_requirements'] * 100, 1)}%

### 工作量变化
- **变化量**: {comparison['changes']['workload_change']} 天
- **变化率**: {round(comparison['changes']['workload_change'] / comparison['summary']['old_workload'] * 100, 1)}%

### 工期变化
- **变化量**: {comparison['changes']['months_change']} 个月
- **变化率**: {round(comparison['changes']['months_change'] / comparison['summary']['old_months'] * 100, 1)}%

## 🎯 系统对比

"""
    
    for system, data in comparison['detailed_comparison']['systems'].items():
        md_content += f"### {system}\n"
        md_content += f"- **旧工作量**: {data['old_workload']} 天\n"
        md_content += f"- **新工作量**: {data['new_workload']} 天\n"
        md_content += f"- **变化**: {data['change']} 天 ({data['change_percentage']}%)\n\n"
    
    md_content += "## 📂 分类对比\n\n"
    
    for category, data in comparison['detailed_comparison']['categories'].items():
        md_content += f"### {category}\n"
        md_content += f"- **旧工作量**: {data['old_days']} 天\n"
        md_content += f"- **新工作量**: {data['new_days']} 天\n"
        md_content += f"- **变化**: {data['change']} 天 ({data['change_percentage']}%)\n\n"
    
    md_content += "## 🎯 优先级对比\n\n"
    
    for priority, data in comparison['detailed_comparison']['priorities'].items():
        md_content += f"### {priority}优先级\n"
        md_content += f"- **旧工作量**: {data['old_days']} 天\n"
        md_content += f"- **新工作量**: {data['new_days']} 天\n"
        md_content += f"- **变化**: {data['change']} 天 ({data['change_percentage']}%)\n\n"
    
    md_content += "## 🔧 需求类型对比\n\n"
    
    for req_type, data in comparison['detailed_comparison']['types'].items():
        md_content += f"### {req_type.replace('_', ' ').title()}\n"
        md_content += f"- **旧工作量**: {data['old_days']} 天\n"
        md_content += f"- **新工作量**: {data['new_days']} 天\n"
        md_content += f"- **变化**: {data['change']} 天 ({data['change_percentage']}%)\n\n"
    
    md_content += "## ⚠️ 影响分析\n\n"
    
    impact = comparison['impact_analysis']
    
    md_content += "### 工作量影响\n"
    md_content += f"- **变化量**: {impact['workload_impact']['change']} 天\n"
    md_content += f"- **变化率**: {impact['workload_impact']['change_percentage']}%\n"
    md_content += f"- **影响程度**: {impact['workload_impact']['severity']}\n\n"
    
    md_content += "### 工期影响\n"
    md_content += f"- **旧工期**: {impact['timeline_impact']['old_months']} 个月\n"
    md_content += f"- **新工期**: {impact['timeline_impact']['new_months']} 个月\n"
    md_content += f"- **工期变化**: {impact['timeline_impact']['months_change']} 个月\n\n"
    
    md_content += "### 资源影响\n"
    md_content += f"- **旧团队规模**: {impact['resource_impact']['old_team_size']}\n"
    md_content += f"- **新团队规模**: {impact['resource_impact']['new_team_size']}\n"
    md_content += f"- **团队变化**: {impact['resource_impact']['team_size_change']}\n\n"
    
    md_content += "### 成本影响\n"
    md_content += f"- **旧成本**: ¥{impact['cost_impact']['old_cost']:,.2f}\n"
    md_content += f"- **新成本**: ¥{impact['cost_impact']['new_cost']:,.2f}\n"
    md_content += f"- **成本变化**: ¥{impact['cost_impact']['cost_change']:,.2f} ({impact['cost_impact']['cost_change_percentage']}%)\n\n"
    
    md_content += "## 💡 建议\n\n"
    
    if comparison['changes']['workload_change'] > 0:
        md_content += "### 工作量增加建议\n"
        md_content += "- 重新评估项目时间线\n"
        md_content += "- 考虑增加开发资源\n"
        md_content += "- 优先实施核心功能\n"
        md_content += "- 考虑分阶段实施\n\n"
    else:
        md_content += "### 工作量减少建议\n"
        md_content += "- 可以提前完成项目\n"
        md_content += "- 考虑增加功能范围\n"
        md_content += "- 优化开发质量\n"
        md_content += "- 增加测试覆盖\n\n"
    
    md_content += "### 风险管理\n"
    md_content += "- 重新评估项目风险\n"
    md_content += "- 更新项目计划\n"
    md_content += "- 调整资源分配\n"
    md_content += "- 加强沟通协调\n\n"
    
    return md_content

if __name__ == "__main__":
    compare_requirements()
    print("🎉 需求对比分析完成！") 