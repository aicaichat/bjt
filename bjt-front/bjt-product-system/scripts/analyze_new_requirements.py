#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
分析新的二期需求文件
"""

import pandas as pd
import json
import os
from datetime import datetime

def analyze_new_requirements():
    """分析新的需求文件"""
    excel_file = 'generated_sql_imports/选型网站二期需求和问题.csv.xlsx'
    output_dir = 'output/new-requirements-analysis'
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print("🔍 开始分析新的二期需求文件...")
    
    try:
        # 读取Excel文件
        xl = pd.ExcelFile(excel_file)
        print(f"✅ 成功读取Excel文件，包含工作表: {xl.sheet_names}")
        
        all_requirements = {}
        
        # 分析二期需求清单
        if '二期需求清单' in xl.sheet_names:
            print("\n📋 分析二期需求清单...")
            df = pd.read_excel(xl, sheet_name='二期需求清单')
            df = df.dropna(how='all')
            
            print(f"✅ 二期需求清单数据形状: {df.shape}")
            
            requirements = []
            for index, row in df.iterrows():
                req = extract_requirement_from_row(row, index, '二期需求清单')
                if req:
                    requirements.append(req)
            
            all_requirements['二期需求清单'] = {
                'total_count': len(requirements),
                'requirements': requirements
            }
            
            print(f"✅ 提取到 {len(requirements)} 个需求")
        
        # 分析各系统需求
        system_sheets = ['选型网站首页', '购物流程', '气垫系统', '纸垫系统', '温水胶带系统', '后台']
        
        print("\n🔧 分析各系统需求...")
        
        for sheet_name in system_sheets:
            if sheet_name in xl.sheet_names:
                print(f"📊 分析工作表: {sheet_name}")
                
                try:
                    df = pd.read_excel(xl, sheet_name=sheet_name)
                    df = df.dropna(how='all')
                    
                    print(f"  - 数据形状: {df.shape}")
                    
                    requirements = []
                    for index, row in df.iterrows():
                        req = extract_requirement_from_row(row, index, sheet_name)
                        if req:
                            requirements.append(req)
                    
                    all_requirements[sheet_name] = {
                        'total_count': len(requirements),
                        'requirements': requirements
                    }
                    
                    print(f"  ✅ 提取到 {len(requirements)} 个需求")
                    
                except Exception as e:
                    print(f"  ❌ 分析工作表 {sheet_name} 失败: {e}")
        
        # 生成分析报告
        generate_analysis_report(all_requirements, output_dir)
        
        print(f"\n🎉 新需求分析完成！输出目录: {output_dir}")
        
    except Exception as e:
        print(f"❌ 分析失败: {e}")

def extract_requirement_from_row(row, index, sheet_name):
    """从行中提取需求信息"""
    requirement = {
        'id': f"{sheet_name}_{index + 1}",
        'sheet': sheet_name,
        'description': '',
        'category': '',
        'priority': '',
        'status': '',
        'estimated_days': 0,
        'complexity': 'medium',
        'type': 'feature'
    }
    
    # 提取所有非空字段
    for col in row.index:
        if pd.notna(row[col]):
            value = str(row[col]).strip()
            if value:
                # 识别字段类型
                if any(keyword in col for keyword in ['描述', '需求', '功能', '问题', '说明']):
                    requirement['description'] = value
                elif any(keyword in col for keyword in ['分类', '类型', '模块']):
                    requirement['category'] = value
                elif any(keyword in col for keyword in ['优先级', '重要', '紧急']):
                    requirement['priority'] = value
                elif any(keyword in col for keyword in ['状态', '进度']):
                    requirement['status'] = value
    
    # 如果没有找到描述，使用第一个非空字段
    if not requirement['description']:
        for col in row.index:
            if pd.notna(row[col]):
                value = str(row[col]).strip()
                if value and len(value) > 3:
                    requirement['description'] = value
                    break
    
    # 估算工作量和复杂度
    if requirement['description']:
        requirement['estimated_days'] = estimate_workload(requirement)
        requirement['complexity'] = assess_complexity(requirement)
        requirement['type'] = classify_requirement_type(requirement)
    
    return requirement if requirement['description'] else None

def estimate_workload(requirement):
    """估算工作量"""
    description = requirement['description'].lower()
    
    # 基础估算
    base_days = 1.0
    
    # 根据关键词调整
    if any(keyword in description for keyword in ['字段', '显示', '格式', '单位', 'lbs', 'lb']):
        base_days = 0.5
    elif any(keyword in description for keyword in ['页面', '界面', '表单', '列表']):
        base_days = 2.0
    elif any(keyword in description for keyword in ['功能', '流程', '系统', '模块']):
        base_days = 3.0
    elif any(keyword in description for keyword in ['API', '接口', '集成', '同步']):
        base_days = 2.5
    elif any(keyword in description for keyword in ['数据库', '表', '数据', '导入']):
        base_days = 1.5
    elif any(keyword in description for keyword in ['购物车', '订单', '支付']):
        base_days = 2.5
    elif any(keyword in description for keyword in ['用户', '权限', '登录']):
        base_days = 2.0
    
    # 根据复杂度调整
    if requirement['complexity'] == 'high':
        base_days *= 1.5
    elif requirement['complexity'] == 'low':
        base_days *= 0.7
    
    return round(base_days, 1)

def assess_complexity(requirement):
    """评估复杂度"""
    description = requirement['description'].lower()
    
    if any(keyword in description for keyword in ['简单', '显示', '格式', '单位']):
        return 'low'
    elif any(keyword in description for keyword in ['复杂', '系统', '集成', '流程', 'API']):
        return 'high'
    else:
        return 'medium'

def classify_requirement_type(requirement):
    """分类需求类型"""
    description = requirement['description'].lower()
    
    if any(keyword in description for keyword in ['bug', '错误', '修复', '问题']):
        return 'bug_fix'
    elif any(keyword in description for keyword in ['优化', '改进', '提升']):
        return 'optimization'
    elif any(keyword in description for keyword in ['新增', '添加', '创建']):
        return 'new_feature'
    else:
        return 'feature'

def generate_analysis_report(all_requirements, output_dir):
    """生成分析报告"""
    print("\n📊 生成分析报告...")
    
    # 计算总体统计
    total_requirements = sum(data['total_count'] for data in all_requirements.values())
    total_workload = sum(
        sum(req['estimated_days'] for req in data['requirements'])
        for data in all_requirements.values()
    )
    
    # 按分类统计
    categories = {}
    priorities = {'高': 0, '中': 0, '低': 0, '未设置': 0}
    types = {'feature': 0, 'bug_fix': 0, 'optimization': 0, 'new_feature': 0}
    
    for system_name, data in all_requirements.items():
        for req in data['requirements']:
            # 分类统计
            category = req.get('category', '未分类')
            if category not in categories:
                categories[category] = {'count': 0, 'days': 0}
            categories[category]['count'] += 1
            categories[category]['days'] += req['estimated_days']
            
            # 优先级统计
            priority = req.get('priority', '未设置')
            if priority in priorities:
                priorities[priority] += req['estimated_days']
            else:
                priorities['未设置'] += req['estimated_days']
            
            # 类型统计
            req_type = req.get('type', 'feature')
            if req_type in types:
                types[req_type] += req['estimated_days']
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'excel_file': 'generated_sql_imports/选型网站二期需求和问题.csv.xlsx',
        'summary': {
            'total_systems': len(all_requirements),
            'total_requirements': total_requirements,
            'total_workload_days': round(total_workload, 1),
            'estimated_months': round(total_workload / 20, 1) if total_workload > 0 else 0
        },
        'systems_analysis': all_requirements,
        'categories_analysis': categories,
        'priorities_analysis': priorities,
        'types_analysis': types,
        'recommendations': generate_recommendations(total_requirements, total_workload)
    }
    
    # 保存JSON报告
    report_file = os.path.join(output_dir, 'new_requirements_analysis.json')
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    
    # 生成Markdown报告
    markdown_report = generate_markdown_report(report)
    markdown_file = os.path.join(output_dir, 'new_requirements_analysis.md')
    with open(markdown_file, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    print(f"✅ 分析报告已保存到:")
    print(f"  - JSON: {report_file}")
    print(f"  - Markdown: {markdown_file}")

def generate_recommendations(total_requirements, total_workload):
    """生成建议"""
    recommendations = {
        'timeline': [],
        'resource_allocation': [],
        'priority_focus': [],
        'risk_mitigation': []
    }
    
    # 时间线建议
    if total_workload > 60:
        recommendations['timeline'].append("工作量较大，建议分3-4个阶段实施")
        recommendations['timeline'].append(f"预计需要{round(total_workload/20, 1)}个月完成")
    elif total_workload > 20:
        recommendations['timeline'].append("工作量适中，建议分2-3个阶段实施")
        recommendations['timeline'].append(f"预计需要{round(total_workload/20, 1)}个月完成")
    else:
        recommendations['timeline'].append("工作量较小，可以集中实施")
        recommendations['timeline'].append(f"预计需要{round(total_workload/20, 1)}个月完成")
    
    # 资源分配建议
    if total_requirements > 20:
        recommendations['resource_allocation'].append("需求数量较多，建议分配2-3名开发人员")
    else:
        recommendations['resource_allocation'].append("需求数量适中，1-2名开发人员即可")
    
    # 优先级建议
    recommendations['priority_focus'].append("优先实施核心功能需求")
    recommendations['priority_focus'].append("Bug修复和优化需求可以并行处理")
    
    return recommendations

def generate_markdown_report(report):
    """生成Markdown格式的报告"""
    md_content = f"""# 新二期需求分析报告

## 📋 报告概览

- **生成时间**: {report['generated_at']}
- **数据源**: {report['excel_file']}
- **总系统数**: {report['summary']['total_systems']}
- **总需求数**: {report['summary']['total_requirements']}
- **总工作量**: {report['summary']['total_workload_days']} 天
- **预计工期**: {report['summary']['estimated_months']} 个月

## 🎯 系统分析

"""
    
    for system_name, data in report['systems_analysis'].items():
        if data['requirements']:
            system_workload = sum(req['estimated_days'] for req in data['requirements'])
            avg_days = round(system_workload / len(data['requirements']), 1) if data['requirements'] else 0
            
            md_content += f"### {system_name}\n"
            md_content += f"- **需求数量**: {data['total_count']} 个\n"
            md_content += f"- **工作量**: {system_workload} 天\n"
            md_content += f"- **平均每个需求**: {avg_days} 天\n\n"
    
    md_content += "## 📊 分类分析\n\n"
    
    for category, data in report['categories_analysis'].items():
        percentage = round(data['days'] / report['summary']['total_workload_days'] * 100, 1) if report['summary']['total_workload_days'] > 0 else 0
        md_content += f"### {category}\n"
        md_content += f"- **需求数量**: {data['count']} 个\n"
        md_content += f"- **工作量**: {data['days']} 天 ({percentage}%)\n\n"
    
    md_content += "## 🎯 优先级分析\n\n"
    
    for priority, days in report['priorities_analysis'].items():
        if days > 0:
            percentage = round(days / report['summary']['total_workload_days'] * 100, 1) if report['summary']['total_workload_days'] > 0 else 0
            md_content += f"- **{priority}**: {days} 天 ({percentage}%)\n"
    
    md_content += "\n## 🔧 需求类型分析\n\n"
    
    for req_type, days in report['types_analysis'].items():
        if days > 0:
            percentage = round(days / report['summary']['total_workload_days'] * 100, 1) if report['summary']['total_workload_days'] > 0 else 0
            md_content += f"- **{req_type.replace('_', ' ').title()}**: {days} 天 ({percentage}%)\n"
    
    md_content += "\n## 📝 详细需求列表\n\n"
    
    for system_name, data in report['systems_analysis'].items():
        if data['requirements']:
            md_content += f"### {system_name}\n\n"
            
            for req in data['requirements']:
                md_content += f"#### {req['id']}\n"
                md_content += f"- **描述**: {req['description']}\n"
                if req['category']:
                    md_content += f"- **分类**: {req['category']}\n"
                if req['priority']:
                    md_content += f"- **优先级**: {req['priority']}\n"
                if req['status']:
                    md_content += f"- **状态**: {req['status']}\n"
                md_content += f"- **类型**: {req['type']}\n"
                md_content += f"- **复杂度**: {req['complexity']}\n"
                md_content += f"- **估算工作量**: {req['estimated_days']} 天\n\n"
    
    md_content += "## 💡 建议\n\n"
    
    for category, suggestions in report['recommendations'].items():
        md_content += f"### {category.replace('_', ' ').title()}\n\n"
        for suggestion in suggestions:
            md_content += f"- {suggestion}\n"
        md_content += "\n"
    
    return md_content

if __name__ == "__main__":
    analyze_new_requirements() 