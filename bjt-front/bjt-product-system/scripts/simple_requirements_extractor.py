#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化的二期需求提取脚本
快速提取Excel中的需求信息并生成报告
"""

import pandas as pd
import json
import os
from datetime import datetime

def extract_requirements():
    """提取二期需求"""
    excel_file = 'generated_sql_imports/选型网站二期需求和问题记录.xlsx'
    output_dir = 'output/phase2-requirements'
    
    # 确保输出目录存在
    os.makedirs(output_dir, exist_ok=True)
    
    print("🔍 开始提取二期需求...")
    
    try:
        # 读取Excel文件
        xl = pd.ExcelFile(excel_file)
        print(f"✅ 成功读取Excel文件，包含工作表: {xl.sheet_names}")
        
        all_requirements = {}
        
        # 处理每个工作表
        for sheet_name in xl.sheet_names:
            if sheet_name in ['二期需求清单', '备份']:
                continue
                
            print(f"📊 处理工作表: {sheet_name}")
            
            try:
                df = pd.read_excel(xl, sheet_name=sheet_name)
                df = df.dropna(how='all')  # 删除全空行
                
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
                print(f"  ❌ 处理工作表 {sheet_name} 失败: {e}")
        
        # 生成汇总报告
        generate_summary_report(all_requirements, output_dir)
        
        # 保存详细数据
        save_detailed_data(all_requirements, output_dir)
        
        print(f"\n🎉 需求提取完成！输出目录: {output_dir}")
        
    except Exception as e:
        print(f"❌ 提取失败: {e}")

def extract_requirement_from_row(row, index, sheet_name):
    """从行中提取需求信息"""
    requirement = {
        'id': f"{sheet_name}_{index + 1}",
        'sheet': sheet_name,
        'description': '',
        'category': '',
        'priority': '',
        'status': '',
        'estimated_days': 0
    }
    
    # 提取描述
    for col in row.index:
        if pd.notna(row[col]) and str(row[col]).strip():
            value = str(row[col]).strip()
            if len(value) > 5:  # 假设描述至少5个字符
                requirement['description'] = value
                break
    
    # 提取其他字段
    for col in row.index:
        if pd.notna(row[col]):
            value = str(row[col]).strip()
            if '分类' in col:
                requirement['category'] = value
            elif '优先级' in col:
                requirement['priority'] = value
            elif '状态' in col:
                requirement['status'] = value
    
    # 估算工作量
    requirement['estimated_days'] = estimate_workload(requirement)
    
    return requirement if requirement['description'] else None

def estimate_workload(requirement):
    """估算工作量"""
    description = requirement['description'].lower()
    
    # 基础估算
    if any(keyword in description for keyword in ['字段', '显示', '格式', '单位']):
        return 0.5
    elif any(keyword in description for keyword in ['页面', '界面', '表单']):
        return 2.0
    elif any(keyword in description for keyword in ['功能', '流程', '系统']):
        return 3.0
    elif any(keyword in description for keyword in ['API', '接口', '集成']):
        return 2.5
    elif any(keyword in description for keyword in ['数据库', '表', '数据']):
        return 1.5
    else:
        return 1.0

def generate_summary_report(all_requirements, output_dir):
    """生成汇总报告"""
    print("\n📊 生成汇总报告...")
    
    total_requirements = sum(data['total_count'] for data in all_requirements.values())
    total_days = sum(
        sum(req['estimated_days'] for req in data['requirements'])
        for data in all_requirements.values()
    )
    
    summary = {
        'generated_at': datetime.now().isoformat(),
        'total_systems': len(all_requirements),
        'total_requirements': total_requirements,
        'total_workload_days': round(total_days, 1),
        'estimated_months': round(total_days / 20, 1) if total_days > 0 else 0,
        'systems': {}
    }
    
    for system_name, data in all_requirements.items():
        system_days = sum(req['estimated_days'] for req in data['requirements'])
        requirements_count = data['total_count']
        avg_days = round(system_days / requirements_count, 1) if requirements_count > 0 else 0
        
        summary['systems'][system_name] = {
            'requirements_count': requirements_count,
            'workload_days': round(system_days, 1),
            'avg_days_per_requirement': avg_days
        }
    
    # 保存汇总报告
    summary_file = os.path.join(output_dir, 'requirements_summary.json')
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    # 生成Markdown报告
    md_content = generate_markdown_summary(summary, all_requirements)
    md_file = os.path.join(output_dir, 'requirements_summary.md')
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(md_content)
    
    print(f"✅ 汇总报告已保存到:")
    print(f"  - JSON: {summary_file}")
    print(f"  - Markdown: {md_file}")

def generate_markdown_summary(summary, all_requirements):
    """生成Markdown格式的汇总报告"""
    md_content = f"""# BJT产品管理系统二期需求汇总报告

## 📋 报告概览

- **生成时间**: {summary['generated_at']}
- **总系统数**: {summary['total_systems']}
- **总需求数**: {summary['total_requirements']}
- **总工作量**: {summary['total_workload_days']} 天
- **预计工期**: {summary['estimated_months']} 个月

## 🎯 系统需求分布

"""
    
    for system_name, data in summary['systems'].items():
        md_content += f"### {system_name}\n"
        md_content += f"- **需求数量**: {data['requirements_count']} 个\n"
        md_content += f"- **工作量**: {data['workload_days']} 天\n"
        md_content += f"- **平均每个需求**: {data['avg_days_per_requirement']} 天\n\n"
    
    md_content += "## 📝 详细需求列表\n\n"
    
    for system_name, data in all_requirements.items():
        if data['requirements']:  # 只显示有需求的工作表
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
                md_content += f"- **估算工作量**: {req['estimated_days']} 天\n\n"
    
    return md_content

def save_detailed_data(all_requirements, output_dir):
    """保存详细数据"""
    print("\n💾 保存详细数据...")
    
    # 保存所有需求
    all_req_file = os.path.join(output_dir, 'all_requirements.json')
    with open(all_req_file, 'w', encoding='utf-8') as f:
        json.dump(all_requirements, f, ensure_ascii=False, indent=2)
    
    # 保存CSV格式
    all_requirements_list = []
    for system_name, data in all_requirements.items():
        for req in data['requirements']:
            all_requirements_list.append({
                'system': system_name,
                'id': req['id'],
                'description': req['description'],
                'category': req['category'],
                'priority': req['priority'],
                'status': req['status'],
                'estimated_days': req['estimated_days']
            })
    
    if all_requirements_list:
        df = pd.DataFrame(all_requirements_list)
        csv_file = os.path.join(output_dir, 'all_requirements.csv')
        df.to_csv(csv_file, index=False, encoding='utf-8-sig')
        
        print(f"✅ 详细数据已保存到:")
        print(f"  - JSON: {all_req_file}")
        print(f"  - CSV: {csv_file}")
    else:
        print("⚠️ 没有提取到任何需求数据")

if __name__ == "__main__":
    extract_requirements() 