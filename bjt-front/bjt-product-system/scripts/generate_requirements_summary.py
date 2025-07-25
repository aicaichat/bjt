#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成二期需求总结报告
"""

import json
import os
from datetime import datetime

def generate_summary():
    """生成需求总结报告"""
    detailed_file = 'output/detailed-requirements-analysis/detailed_requirements_analysis.json'
    output_dir = 'output/requirements-summary'
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print("📊 生成需求总结报告...")
    
    # 读取详细分析数据
    with open(detailed_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 生成总结报告
    summary = {
        'generated_at': datetime.now().isoformat(),
        'overview': generate_overview(data),
        'priority_analysis': analyze_by_priority(data),
        'complexity_analysis': analyze_by_complexity(data),
        'risk_analysis': analyze_by_risk(data),
        'timeline_suggestions': generate_timeline_suggestions(data),
        'resource_allocation': generate_resource_allocation(data),
        'cost_estimation': generate_cost_estimation(data),
        'key_highlights': generate_key_highlights(data)
    }
    
    # 保存总结报告
    summary_file = os.path.join(output_dir, 'requirements_summary.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    # 生成Markdown总结报告
    markdown_summary = generate_markdown_summary(summary)
    markdown_file = os.path.join(output_dir, 'requirements_summary.md')
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write(markdown_summary)
    
    print(f"✅ 总结报告已保存到:")
    print(f"  - JSON: {summary_file}")
    print(f"  - Markdown: {markdown_file}")

def generate_overview(data):
    """生成概览"""
    summary = data['summary']
    
    return {
        'total_requirements': summary['total_requirements'],
        'total_days': summary['total_days'],
        'estimated_months': summary['estimated_months'],
        'frontend_percentage': round(summary['frontend_days'] / summary['total_days'] * 100, 1),
        'backend_percentage': round(summary['backend_days'] / summary['total_days'] * 100, 1),
        'database_percentage': round(summary['database_days'] / summary['total_days'] * 100, 1),
        'testing_percentage': round(summary['testing_days'] / summary['total_days'] * 100, 1)
    }

def analyze_by_priority(data):
    """按优先级分析"""
    priority_stats = {}
    
    for req in data['requirements']:
        priority = req.get('priority', '未设置')
        if priority not in priority_stats:
            priority_stats[priority] = {'count': 0, 'days': 0, 'requirements': []}
        
        priority_stats[priority]['count'] += 1
        priority_stats[priority]['days'] += req['estimated_days']
        priority_stats[priority]['requirements'].append({
            'id': req['id'],
            'description': req['description'][:50] + '...' if len(req['description']) > 50 else req['description'],
            'days': req['estimated_days']
        })
    
    return priority_stats

def analyze_by_complexity(data):
    """按复杂度分析"""
    complexity_stats = {}
    
    for req in data['requirements']:
        complexity = req['complexity']
        if complexity not in complexity_stats:
            complexity_stats[complexity] = {'count': 0, 'days': 0}
        
        complexity_stats[complexity]['count'] += 1
        complexity_stats[complexity]['days'] += req['estimated_days']
    
    return complexity_stats

def analyze_by_risk(data):
    """按风险等级分析"""
    risk_stats = {}
    
    for req in data['requirements']:
        risk = req['risk_level']
        if risk not in risk_stats:
            risk_stats[risk] = {'count': 0, 'days': 0}
        
        risk_stats[risk]['count'] += 1
        risk_stats[risk]['days'] += req['estimated_days']
    
    return risk_stats

def generate_timeline_suggestions(data):
    """生成时间线建议"""
    total_days = data['summary']['total_days']
    
    suggestions = {
        'total_days': total_days,
        'estimated_months': data['summary']['estimated_months'],
        'phases': []
    }
    
    if total_days > 100:
        # 分4个阶段
        phase1_days = total_days * 0.3  # 30% - 核心功能
        phase2_days = total_days * 0.3  # 30% - 重要功能
        phase3_days = total_days * 0.25  # 25% - 优化功能
        phase4_days = total_days * 0.15  # 15% - 完善功能
        
        suggestions['phases'] = [
            {
                'name': '第一阶段 - 核心功能',
                'days': round(phase1_days, 1),
                'months': round(phase1_days / 20, 1),
                'focus': '高优先级核心功能、Bug修复'
            },
            {
                'name': '第二阶段 - 重要功能',
                'days': round(phase2_days, 1),
                'months': round(phase2_days / 20, 1),
                'focus': '中优先级功能、用户体验优化'
            },
            {
                'name': '第三阶段 - 优化功能',
                'days': round(phase3_days, 1),
                'months': round(phase3_days / 20, 1),
                'focus': '功能优化、性能提升'
            },
            {
                'name': '第四阶段 - 完善功能',
                'days': round(phase4_days, 1),
                'months': round(phase4_days / 20, 1),
                'focus': '低优先级功能、测试完善'
            }
        ]
    else:
        # 分3个阶段
        phase1_days = total_days * 0.4  # 40% - 核心功能
        phase2_days = total_days * 0.4  # 40% - 重要功能
        phase3_days = total_days * 0.2  # 20% - 优化功能
        
        suggestions['phases'] = [
            {
                'name': '第一阶段 - 核心功能',
                'days': round(phase1_days, 1),
                'months': round(phase1_days / 20, 1),
                'focus': '高优先级核心功能、Bug修复'
            },
            {
                'name': '第二阶段 - 重要功能',
                'days': round(phase2_days, 1),
                'months': round(phase2_days / 20, 1),
                'focus': '中优先级功能、用户体验优化'
            },
            {
                'name': '第三阶段 - 优化功能',
                'days': round(phase3_days, 1),
                'months': round(phase3_days / 20, 1),
                'focus': '功能优化、测试完善'
            }
        ]
    
    return suggestions

def generate_resource_allocation(data):
    """生成资源分配建议"""
    total_days = data['summary']['total_days']
    
    if total_days > 120:
        team_size = '5-7人'
        roles = [
            {'role': '项目经理', 'count': 1, 'responsibility': '项目管理和协调'},
            {'role': '资深前端开发', 'count': 2, 'responsibility': '前端核心功能开发'},
            {'role': '资深后端开发', 'count': 2, 'responsibility': '后端核心功能开发'},
            {'role': '测试工程师', 'count': 1, 'responsibility': '功能测试和回归测试'},
            {'role': 'UI/UX设计师', 'count': 1, 'responsibility': '界面优化和用户体验'}
        ]
    elif total_days > 60:
        team_size = '4-5人'
        roles = [
            {'role': '项目经理', 'count': 1, 'responsibility': '项目管理和协调'},
            {'role': '前端开发', 'count': 1, 'responsibility': '前端功能开发'},
            {'role': '后端开发', 'count': 1, 'responsibility': '后端功能开发'},
            {'role': '全栈开发', 'count': 1, 'responsibility': '全栈功能开发'},
            {'role': '测试工程师', 'count': 1, 'responsibility': '功能测试'}
        ]
    else:
        team_size = '3-4人'
        roles = [
            {'role': '项目经理', 'count': 1, 'responsibility': '项目管理和协调'},
            {'role': '前端开发', 'count': 1, 'responsibility': '前端功能开发'},
            {'role': '后端开发', 'count': 1, 'responsibility': '后端功能开发'},
            {'role': '测试工程师', 'count': 1, 'responsibility': '功能测试'}
        ]
    
    return {
        'team_size': team_size,
        'roles': roles,
        'estimated_cost_per_day': 7800,  # 假设每天7800元
        'total_cost': total_days * 7800
    }

def generate_cost_estimation(data):
    """生成成本估算"""
    total_days = data['summary']['total_days']
    
    # 不同角色的日薪估算
    role_costs = {
        '项目经理': 1000,
        '资深前端开发': 1200,
        '资深后端开发': 1200,
        '前端开发': 1000,
        '后端开发': 1000,
        '全栈开发': 1100,
        '测试工程师': 800,
        'UI/UX设计师': 900
    }
    
    # 根据工作量估算团队配置
    if total_days > 120:
        daily_cost = 1000 + 1200*2 + 1200*2 + 800 + 900  # 项目经理 + 2资深前端 + 2资深后端 + 测试 + 设计
    elif total_days > 60:
        daily_cost = 1000 + 1000 + 1000 + 1100 + 800  # 项目经理 + 前端 + 后端 + 全栈 + 测试
    else:
        daily_cost = 1000 + 1000 + 1000 + 800  # 项目经理 + 前端 + 后端 + 测试
    
    total_cost = total_days * daily_cost
    
    return {
        'total_days': total_days,
        'average_daily_cost': daily_cost,
        'total_cost': total_cost,
        'cost_per_month': total_cost / (total_days / 20),
        'role_costs': role_costs
    }

def generate_key_highlights(data):
    """生成关键亮点"""
    highlights = []
    
    # 分析最高工作量的需求
    sorted_reqs = sorted(data['requirements'], key=lambda x: x['estimated_days'], reverse=True)
    top_5 = sorted_reqs[:5]
    
    highlights.append({
        'title': '工作量最大的5个需求',
        'items': [{'id': req['id'], 'description': req['description'][:30] + '...', 'days': req['estimated_days']} for req in top_5]
    })
    
    # 分析高风险需求
    high_risk_reqs = [req for req in data['requirements'] if req['risk_level'] == 'high']
    if high_risk_reqs:
        highlights.append({
            'title': '高风险需求',
            'items': [{'id': req['id'], 'description': req['description'][:30] + '...', 'days': req['estimated_days']} for req in high_risk_reqs]
        })
    
    # 分析高复杂度需求
    high_complexity_reqs = [req for req in data['requirements'] if req['complexity'] == 'high']
    if high_complexity_reqs:
        highlights.append({
            'title': '高复杂度需求',
            'items': [{'id': req['id'], 'description': req['description'][:30] + '...', 'days': req['estimated_days']} for req in high_complexity_reqs]
        })
    
    return highlights

def generate_markdown_summary(summary):
    """生成Markdown格式的总结报告"""
    md_content = f"""# 二期需求总结报告

## 📋 项目概览

- **生成时间**: {summary['generated_at']}
- **总需求数**: {summary['overview']['total_requirements']} 个
- **总工作量**: {summary['overview']['total_days']} 天
- **预计工期**: {summary['overview']['estimated_months']} 个月

## 📊 工作量分布

### 按开发阶段
- **前端开发**: {summary['overview']['frontend_percentage']}% ({summary['overview']['total_days'] * summary['overview']['frontend_percentage'] / 100:.1f} 天)
- **后端开发**: {summary['overview']['backend_percentage']}% ({summary['overview']['total_days'] * summary['overview']['backend_percentage'] / 100:.1f} 天)
- **数据库**: {summary['overview']['database_percentage']}% ({summary['overview']['total_days'] * summary['overview']['database_percentage'] / 100:.1f} 天)
- **测试**: {summary['overview']['testing_percentage']}% ({summary['overview']['total_days'] * summary['overview']['testing_percentage'] / 100:.1f} 天)

## 🎯 优先级分析

"""
    
    for priority, stats in summary['priority_analysis'].items():
        percentage = round(stats['days'] / summary['overview']['total_days'] * 100, 1)
        md_content += f"### {priority}优先级\n"
        md_content += f"- **需求数量**: {stats['count']} 个\n"
        md_content += f"- **工作量**: {stats['days']} 天 ({percentage}%)\n"
        md_content += f"- **平均每个需求**: {round(stats['days'] / stats['count'], 1)} 天\n\n"
    
    md_content += "## 🔧 复杂度分析\n\n"
    
    for complexity, stats in summary['complexity_analysis'].items():
        percentage = round(stats['days'] / summary['overview']['total_days'] * 100, 1)
        md_content += f"### {complexity.title()}复杂度\n"
        md_content += f"- **需求数量**: {stats['count']} 个\n"
        md_content += f"- **工作量**: {stats['days']} 天 ({percentage}%)\n\n"
    
    md_content += "## ⚠️ 风险分析\n\n"
    
    for risk, stats in summary['risk_analysis'].items():
        percentage = round(stats['days'] / summary['overview']['total_days'] * 100, 1)
        md_content += f"### {risk.title()}风险\n"
        md_content += f"- **需求数量**: {stats['count']} 个\n"
        md_content += f"- **工作量**: {stats['days']} 天 ({percentage}%)\n\n"
    
    md_content += "## 📅 时间线建议\n\n"
    
    timeline = summary['timeline_suggestions']
    md_content += f"- **总工作量**: {timeline['total_days']} 天\n"
    md_content += f"- **预计工期**: {timeline['estimated_months']} 个月\n\n"
    
    for phase in timeline['phases']:
        md_content += f"### {phase['name']}\n"
        md_content += f"- **工作量**: {phase['days']} 天 ({phase['months']} 个月)\n"
        md_content += f"- **重点**: {phase['focus']}\n\n"
    
    md_content += "## 👥 资源分配建议\n\n"
    
    resource = summary['resource_allocation']
    md_content += f"- **建议团队规模**: {resource['team_size']}\n"
    md_content += f"- **估算总成本**: ¥{resource['total_cost']:,.2f}\n\n"
    
    md_content += "### 角色配置\n\n"
    for role in resource['roles']:
        md_content += f"- **{role['role']}**: {role['count']} 人 - {role['responsibility']}\n"
    
    md_content += "\n## 💰 成本估算\n\n"
    
    cost = summary['cost_estimation']
    md_content += f"- **总工作量**: {cost['total_days']} 天\n"
    md_content += f"- **平均日成本**: ¥{cost['average_daily_cost']:,.2f}\n"
    md_content += f"- **总成本**: ¥{cost['total_cost']:,.2f}\n"
    md_content += f"- **月均成本**: ¥{cost['cost_per_month']:,.2f}\n\n"
    
    md_content += "## 🔍 关键亮点\n\n"
    
    for highlight in summary['key_highlights']:
        md_content += f"### {highlight['title']}\n\n"
        for item in highlight['items']:
            md_content += f"- **{item['id']}**: {item['description']} ({item['days']} 天)\n"
        md_content += "\n"
    
    md_content += "## 💡 实施建议\n\n"
    
    md_content += "### 优先级策略\n"
    md_content += "1. **第一阶段**: 优先实施高优先级需求，确保核心功能稳定\n"
    md_content += "2. **第二阶段**: 实施中优先级需求，完善用户体验\n"
    md_content += "3. **第三阶段**: 实施低优先级需求，进行功能优化\n\n"
    
    md_content += "### 风险管理\n"
    md_content += "1. **高风险需求**: 提前进行技术调研，制定应急预案\n"
    md_content += "2. **高复杂度需求**: 分解为小任务，逐步实施\n"
    md_content += "3. **依赖关系**: 合理安排开发顺序，避免阻塞\n\n"
    
    md_content += "### 质量保证\n"
    md_content += "1. **测试覆盖**: 确保每个需求都有充分的测试\n"
    md_content += "2. **代码审查**: 建立代码审查机制，保证代码质量\n"
    md_content += "3. **持续集成**: 建立CI/CD流程，自动化测试和部署\n\n"
    
    md_content += f"""---
*报告生成时间: {summary['generated_at']}*
"""
    
    return md_content

if __name__ == "__main__":
    generate_summary()
    print("🎉 需求总结报告生成完成！") 