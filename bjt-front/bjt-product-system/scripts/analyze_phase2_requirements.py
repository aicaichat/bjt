#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BJT产品管理系统二期需求详细分析脚本
从Excel中提取具体需求并生成工作量评估
"""

import pandas as pd
import json
import os
from datetime import datetime
from typing import Dict, List, Any
import argparse

class Phase2RequirementsAnalyzer:
    def __init__(self, excel_file: str):
        self.excel_file = excel_file
        self.output_dir = "output/phase2-requirements"
        self.requirements = {}
        self.workload_estimates = {}
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
    def analyze_all_requirements(self):
        """分析所有需求"""
        print("🔍 开始分析二期需求...")
        
        # 读取Excel文件
        try:
            xl = pd.ExcelFile(self.excel_file)
            print(f"✅ 成功读取Excel文件，包含工作表: {xl.sheet_names}")
        except Exception as e:
            print(f"❌ 读取Excel文件失败: {e}")
            return False
        
        # 分析各系统需求
        self.analyze_system_requirements(xl)
        
        # 生成工作量评估
        self.generate_workload_estimates()
        
        # 生成详细报告
        self.generate_detailed_report()
        
        return True
    
    def analyze_system_requirements(self, xl):
        """分析各系统需求"""
        system_sheets = ['选型网站首页', '购物流程', '气垫系统', '纸垫系统', '温水胶带系统', '后台']
        
        print("\n🔧 分析各系统需求...")
        
        for sheet_name in system_sheets:
            if sheet_name in xl.sheet_names:
                print(f"📊 分析工作表: {sheet_name}")
                self.analyze_single_system(xl, sheet_name)
    
    def analyze_single_system(self, xl, sheet_name):
        """分析单个系统"""
        try:
            df = pd.read_excel(xl, sheet_name=sheet_name)
            print(f"  - 数据形状: {df.shape}")
            
            # 清理数据
            df = df.dropna(how='all')
            
            # 分析需求
            system_requirements = self.extract_requirements_from_df(df, sheet_name)
            self.requirements[sheet_name] = system_requirements
            
            # 保存原始数据
            output_file = os.path.join(self.output_dir, f'{sheet_name}_requirements.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(system_requirements, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ 已保存到: {output_file}")
            
        except Exception as e:
            print(f"  ❌ 分析工作表 {sheet_name} 失败: {e}")
    
    def extract_requirements_from_df(self, df, system_name):
        """从DataFrame中提取需求"""
        requirements = {
            'system_name': system_name,
            'total_count': len(df),
            'requirements_list': [],
            'categories': {},
            'priorities': {},
            'estimated_workload': {}
        }
        
        # 提取具体需求
        for index, row in df.iterrows():
            requirement = self.parse_requirement_row(row, index)
            if requirement:
                requirements['requirements_list'].append(requirement)
        
        # 分析分类
        if '分类' in df.columns:
            requirements['categories'] = df['分类'].value_counts().to_dict()
        
        # 分析优先级
        if '优先级' in df.columns:
            requirements['priorities'] = df['优先级'].value_counts().to_dict()
        
        return requirements
    
    def parse_requirement_row(self, row, index):
        """解析需求行"""
        requirement = {
            'id': index + 1,
            'description': '',
            'category': '',
            'priority': '',
            'status': '',
            'estimated_days': 0,
            'complexity': 'medium'
        }
        
        # 提取描述
        for col in row.index:
            if '描述' in col or '需求' in col or '问题' in col:
                if pd.notna(row[col]) and str(row[col]).strip():
                    requirement['description'] = str(row[col]).strip()
                    break
        
        # 提取分类
        if '分类' in row.index and pd.notna(row['分类']):
            requirement['category'] = str(row['分类']).strip()
        
        # 提取优先级
        if '优先级' in row.index and pd.notna(row['优先级']):
            requirement['priority'] = str(row['优先级']).strip()
        
        # 提取状态
        if '状态' in row.index and pd.notna(row['状态']):
            requirement['status'] = str(row['状态']).strip()
        
        # 估算工作量
        requirement['estimated_days'] = self.estimate_workload(requirement)
        requirement['complexity'] = self.assess_complexity(requirement)
        
        return requirement if requirement['description'] else None
    
    def estimate_workload(self, requirement):
        """估算工作量（天数）"""
        description = requirement['description'].lower()
        category = requirement['category'].lower()
        priority = requirement['priority'].lower()
        
        # 基础工作量
        base_days = 1
        
        # 根据描述关键词调整
        if any(keyword in description for keyword in ['字段', '显示', '格式']):
            base_days = 0.5
        elif any(keyword in description for keyword in ['页面', '界面', '表单']):
            base_days = 2
        elif any(keyword in description for keyword in ['功能', '流程', '系统']):
            base_days = 3
        elif any(keyword in description for keyword in ['API', '接口', '集成']):
            base_days = 2.5
        elif any(keyword in description for keyword in ['数据库', '表', '数据']):
            base_days = 1.5
        
        # 根据分类调整
        if '前端' in category or '界面' in category:
            base_days *= 1.2
        elif '后端' in category or 'API' in category:
            base_days *= 1.5
        elif '数据库' in category:
            base_days *= 0.8
        
        # 根据优先级调整
        if '高' in priority or 'P0' in priority:
            base_days *= 1.3
        elif '低' in priority or 'P3' in priority:
            base_days *= 0.7
        
        return round(base_days, 1)
    
    def assess_complexity(self, requirement):
        """评估复杂度"""
        description = requirement['description'].lower()
        
        if any(keyword in description for keyword in ['简单', '显示', '格式']):
            return 'low'
        elif any(keyword in description for keyword in ['复杂', '系统', '集成', '流程']):
            return 'high'
        else:
            return 'medium'
    
    def generate_workload_estimates(self):
        """生成工作量评估"""
        print("\n📊 生成工作量评估...")
        
        total_workload = {
            'total_days': 0,
            'by_system': {},
            'by_priority': {'high': 0, 'medium': 0, 'low': 0},
            'by_complexity': {'high': 0, 'medium': 0, 'low': 0}
        }
        
        for system_name, system_data in self.requirements.items():
            system_workload = {
                'total_days': 0,
                'requirement_count': len(system_data['requirements_list']),
                'by_priority': {'high': 0, 'medium': 0, 'low': 0},
                'by_complexity': {'high': 0, 'medium': 0, 'low': 0}
            }
            
            for req in system_data['requirements_list']:
                days = req['estimated_days']
                system_workload['total_days'] += days
                total_workload['total_days'] += days
                
                # 按优先级分类
                priority = req['priority'].lower()
                if '高' in priority or 'P0' in priority:
                    system_workload['by_priority']['high'] += days
                    total_workload['by_priority']['high'] += days
                elif '低' in priority or 'P3' in priority:
                    system_workload['by_priority']['low'] += days
                    total_workload['by_priority']['low'] += days
                else:
                    system_workload['by_priority']['medium'] += days
                    total_workload['by_priority']['medium'] += days
                
                # 按复杂度分类
                complexity = req['complexity']
                system_workload['by_complexity'][complexity] += days
                total_workload['by_complexity'][complexity] += days
            
            total_workload['by_system'][system_name] = system_workload
        
        self.workload_estimates = total_workload
        
        # 保存工作量评估
        output_file = os.path.join(self.output_dir, 'workload_estimates.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(total_workload, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 工作量评估已保存到: {output_file}")
    
    def generate_detailed_report(self):
        """生成详细报告"""
        print("\n📋 生成详细报告...")
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'excel_file': self.excel_file,
            'summary': self.generate_summary(),
            'workload_analysis': self.workload_estimates,
            'system_details': self.requirements,
            'recommendations': self.generate_recommendations()
        }
        
        # 保存完整报告
        report_file = os.path.join(self.output_dir, 'detailed_requirements_report.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成Markdown报告
        markdown_report = self.generate_markdown_report(report)
        markdown_file = os.path.join(self.output_dir, 'detailed_requirements_report.md')
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        print(f"✅ 详细报告已保存到:")
        print(f"  - JSON: {report_file}")
        print(f"  - Markdown: {markdown_file}")
    
    def generate_summary(self):
        """生成摘要"""
        total_requirements = sum(len(data['requirements_list']) for data in self.requirements.values())
        total_days = self.workload_estimates['total_days']
        
        summary = {
            'total_systems': len(self.requirements),
            'total_requirements': total_requirements,
            'total_workload_days': total_days,
            'estimated_months': round(total_days / 20, 1),  # 假设每月20个工作日
            'systems_covered': list(self.requirements.keys())
        }
        
        return summary
    
    def generate_recommendations(self):
        """生成建议"""
        total_days = self.workload_estimates['total_days']
        
        recommendations = {
            'timeline': [],
            'resource_allocation': [],
            'priority_focus': [],
            'risk_mitigation': []
        }
        
        # 时间线建议
        if total_days > 120:
            recommendations['timeline'].append("工作量较大，建议分3-4个阶段实施")
            recommendations['timeline'].append("每个阶段2-3个月，总计6-8个月")
        elif total_days > 60:
            recommendations['timeline'].append("工作量适中，建议分2-3个阶段实施")
            recommendations['timeline'].append("每个阶段1-2个月，总计3-4个月")
        else:
            recommendations['timeline'].append("工作量较小，可以集中实施")
            recommendations['timeline'].append("预计1-2个月完成")
        
        # 资源分配建议
        high_priority_days = self.workload_estimates['by_priority']['high']
        if high_priority_days > total_days * 0.4:
            recommendations['resource_allocation'].append("高优先级需求较多，建议优先分配资深开发人员")
        else:
            recommendations['resource_allocation'].append("需求分布相对均衡，可以灵活分配资源")
        
        # 优先级建议
        recommendations['priority_focus'].append("优先实施高优先级需求，确保核心功能稳定")
        recommendations['priority_focus'].append("中优先级需求可以并行开发")
        recommendations['priority_focus'].append("低优先级需求作为优化项目")
        
        # 风险缓解建议
        high_complexity_days = self.workload_estimates['by_complexity']['high']
        if high_complexity_days > total_days * 0.3:
            recommendations['risk_mitigation'].append("复杂需求较多，建议增加技术评审和测试时间")
            recommendations['risk_mitigation'].append("考虑引入外部技术专家")
        else:
            recommendations['risk_mitigation'].append("复杂度适中，按常规开发流程执行")
        
        return recommendations
    
    def generate_markdown_report(self, report):
        """生成Markdown格式的报告"""
        md_content = f"""# BJT产品管理系统二期需求详细分析报告

## 📋 报告概览

- **生成时间**: {report['generated_at']}
- **数据源**: {report['excel_file']}
- **总系统数**: {report['summary']['total_systems']}
- **总需求数**: {report['summary']['total_requirements']}
- **总工作量**: {report['summary']['total_workload_days']} 天
- **预计工期**: {report['summary']['estimated_months']} 个月

## 🎯 系统覆盖范围

"""
        
        for system in report['summary']['systems_covered']:
            system_data = report['system_details'][system]
            md_content += f"- **{system}**: {len(system_data['requirements_list'])} 个需求\n"
        
        md_content += "\n## 📊 工作量分析\n\n"
        
        # 按系统分析
        md_content += "### 按系统分布\n\n"
        for system_name, workload in report['workload_analysis']['by_system'].items():
            md_content += f"#### {system_name}\n"
            md_content += f"- **总工作量**: {workload['total_days']} 天\n"
            md_content += f"- **需求数量**: {workload['requirement_count']} 个\n"
            md_content += f"- **平均每个需求**: {round(workload['total_days']/workload['requirement_count'], 1)} 天\n\n"
        
        # 按优先级分析
        md_content += "### 按优先级分布\n\n"
        for priority, days in report['workload_analysis']['by_priority'].items():
            percentage = round(days / report['summary']['total_workload_days'] * 100, 1)
            md_content += f"- **{priority.title()}**: {days} 天 ({percentage}%)\n"
        
        md_content += "\n### 按复杂度分布\n\n"
        for complexity, days in report['workload_analysis']['by_complexity'].items():
            percentage = round(days / report['summary']['total_workload_days'] * 100, 1)
            md_content += f"- **{complexity.title()}**: {days} 天 ({percentage}%)\n"
        
        md_content += "\n## 💡 建议\n\n"
        
        for category, suggestions in report['recommendations'].items():
            md_content += f"### {category.replace('_', ' ').title()}\n\n"
            for suggestion in suggestions:
                md_content += f"- {suggestion}\n"
            md_content += "\n"
        
        # 详细需求列表
        md_content += "## 📝 详细需求列表\n\n"
        
        for system_name, system_data in report['system_details'].items():
            md_content += f"### {system_name}\n\n"
            
            for req in system_data['requirements_list']:
                md_content += f"#### 需求 {req['id']}\n"
                md_content += f"- **描述**: {req['description']}\n"
                md_content += f"- **分类**: {req['category']}\n"
                md_content += f"- **优先级**: {req['priority']}\n"
                md_content += f"- **状态**: {req['status']}\n"
                md_content += f"- **估算工作量**: {req['estimated_days']} 天\n"
                md_content += f"- **复杂度**: {req['complexity']}\n\n"
        
        return md_content

def main():
    parser = argparse.ArgumentParser(description='分析BJT产品管理系统二期需求')
    parser.add_argument('--excel-file', 
                       default='generated_sql_imports/选型网站二期需求和问题记录.xlsx',
                       help='Excel文件路径')
    parser.add_argument('--output-dir', 
                       default='output/phase2-requirements',
                       help='输出目录')
    
    args = parser.parse_args()
    
    # 检查文件是否存在
    if not os.path.exists(args.excel_file):
        print(f"❌ Excel文件不存在: {args.excel_file}")
        return
    
    # 创建分析器并执行
    analyzer = Phase2RequirementsAnalyzer(args.excel_file)
    success = analyzer.analyze_all_requirements()
    
    if success:
        print("\n🎉 需求分析完成！")
        print(f"📁 输出目录: {args.output_dir}")
    else:
        print("\n❌ 需求分析失败！")

if __name__ == "__main__":
    main() 