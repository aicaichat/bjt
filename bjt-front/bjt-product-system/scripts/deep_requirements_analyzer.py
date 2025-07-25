#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深度二期需求分析脚本
深入分析Excel中的需求信息，包括需求分类、优先级和工作量评估
"""

import pandas as pd
import json
import os
from datetime import datetime
import re

class DeepRequirementsAnalyzer:
    def __init__(self, excel_file: str):
        self.excel_file = excel_file
        self.output_dir = 'output/phase2-requirements'
        self.requirements = {}
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
    def analyze_all_requirements(self):
        """分析所有需求"""
        print("🔍 开始深度分析二期需求...")
        
        try:
            # 读取Excel文件
            xl = pd.ExcelFile(self.excel_file)
            print(f"✅ 成功读取Excel文件，包含工作表: {xl.sheet_names}")
            
            # 分析二期需求清单
            self.analyze_phase2_requirements_list(xl)
            
            # 分析各系统需求
            self.analyze_system_requirements(xl)
            
            # 生成综合分析报告
            self.generate_comprehensive_report()
            
            return True
            
        except Exception as e:
            print(f"❌ 分析失败: {e}")
            return False
    
    def analyze_phase2_requirements_list(self, xl):
        """分析二期需求清单"""
        print("\n📋 分析二期需求清单...")
        
        try:
            if '二期需求清单' in xl.sheet_names:
                df = pd.read_excel(xl, sheet_name='二期需求清单')
                df = df.dropna(how='all')
                
                print(f"✅ 二期需求清单数据形状: {df.shape}")
                
                # 分析需求
                phase2_requirements = self.extract_phase2_requirements(df)
                self.requirements['phase2_list'] = phase2_requirements
                
                # 保存分析结果
                output_file = os.path.join(self.output_dir, 'phase2_requirements_analysis.json')
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(phase2_requirements, f, ensure_ascii=False, indent=2)
                
                print(f"✅ 二期需求清单分析已保存到: {output_file}")
                
        except Exception as e:
            print(f"❌ 分析二期需求清单失败: {e}")
    
    def extract_phase2_requirements(self, df):
        """提取二期需求清单"""
        requirements = {
            'total_count': len(df),
            'requirements': [],
            'categories': {},
            'priorities': {},
            'estimated_workload': 0
        }
        
        for index, row in df.iterrows():
            req = self.parse_phase2_requirement(row, index)
            if req:
                requirements['requirements'].append(req)
                requirements['estimated_workload'] += req['estimated_days']
        
        # 分析分类和优先级
        for req in requirements['requirements']:
            if req['category']:
                requirements['categories'][req['category']] = requirements['categories'].get(req['category'], 0) + 1
            if req['priority']:
                requirements['priorities'][req['priority']] = requirements['priorities'].get(req['priority'], 0) + 1
        
        return requirements
    
    def parse_phase2_requirement(self, row, index):
        """解析二期需求行"""
        requirement = {
            'id': f"P2_{index + 1}",
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
                    if any(keyword in col for keyword in ['描述', '需求', '功能', '问题']):
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
            requirement['estimated_days'] = self.estimate_workload(requirement)
            requirement['complexity'] = self.assess_complexity(requirement)
            requirement['type'] = self.classify_requirement_type(requirement)
        
        return requirement if requirement['description'] else None
    
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
            df = df.dropna(how='all')
            
            print(f"  - 数据形状: {df.shape}")
            
            # 分析需求
            system_requirements = self.extract_system_requirements(df, sheet_name)
            self.requirements[sheet_name] = system_requirements
            
            # 保存分析结果
            output_file = os.path.join(self.output_dir, f'{sheet_name}_analysis.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(system_requirements, f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ 已保存到: {output_file}")
            
        except Exception as e:
            print(f"  ❌ 分析工作表 {sheet_name} 失败: {e}")
    
    def extract_system_requirements(self, df, system_name):
        """提取系统需求"""
        requirements = {
            'system_name': system_name,
            'total_count': len(df),
            'requirements': [],
            'categories': {},
            'priorities': {},
            'estimated_workload': 0,
            'columns_analysis': self.analyze_columns(df)
        }
        
        for index, row in df.iterrows():
            req = self.parse_system_requirement(row, index, system_name)
            if req:
                requirements['requirements'].append(req)
                requirements['estimated_workload'] += req['estimated_days']
        
        # 分析分类和优先级
        for req in requirements['requirements']:
            if req['category']:
                requirements['categories'][req['category']] = requirements['categories'].get(req['category'], 0) + 1
            if req['priority']:
                requirements['priorities'][req['priority']] = requirements['priorities'].get(req['priority'], 0) + 1
        
        return requirements
    
    def parse_system_requirement(self, row, index, system_name):
        """解析系统需求行"""
        requirement = {
            'id': f"{system_name}_{index + 1}",
            'system': system_name,
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
            requirement['estimated_days'] = self.estimate_workload(requirement)
            requirement['complexity'] = self.assess_complexity(requirement)
            requirement['type'] = self.classify_requirement_type(requirement)
        
        return requirement if requirement['description'] else None
    
    def analyze_columns(self, df):
        """分析列结构"""
        analysis = {
            'total_columns': len(df.columns),
            'columns': list(df.columns),
            'data_types': {str(k): str(v) for k, v in df.dtypes.to_dict().items()},
            'missing_data': {str(k): int(v) for k, v in df.isnull().sum().to_dict().items()},
            'unique_values': {}
        }
        
        # 分析每列的唯一值
        for col in df.columns:
            if df[col].dtype == 'object':
                unique_vals = df[col].value_counts().head(5).to_dict()
                analysis['unique_values'][str(col)] = {str(k): int(v) for k, v in unique_vals.items()}
        
        return analysis
    
    def estimate_workload(self, requirement):
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
    
    def assess_complexity(self, requirement):
        """评估复杂度"""
        description = requirement['description'].lower()
        
        if any(keyword in description for keyword in ['简单', '显示', '格式', '单位']):
            return 'low'
        elif any(keyword in description for keyword in ['复杂', '系统', '集成', '流程', 'API']):
            return 'high'
        else:
            return 'medium'
    
    def classify_requirement_type(self, requirement):
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
    
    def generate_comprehensive_report(self):
        """生成综合分析报告"""
        print("\n📊 生成综合分析报告...")
        
        # 计算总体统计
        total_requirements = 0
        total_workload = 0
        
        for system_name, data in self.requirements.items():
            if 'requirements' in data:
                total_requirements += len(data['requirements'])
                total_workload += data.get('estimated_workload', 0)
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'excel_file': self.excel_file,
            'summary': {
                'total_systems': len(self.requirements),
                'total_requirements': total_requirements,
                'total_workload_days': round(total_workload, 1),
                'estimated_months': round(total_workload / 20, 1) if total_workload > 0 else 0
            },
            'systems_analysis': self.requirements,
            'recommendations': self.generate_recommendations(total_requirements, total_workload)
        }
        
        # 保存完整报告
        report_file = os.path.join(self.output_dir, 'comprehensive_analysis_report.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成Markdown报告
        markdown_report = self.generate_markdown_report(report)
        markdown_file = os.path.join(self.output_dir, 'comprehensive_analysis_report.md')
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        print(f"✅ 综合分析报告已保存到:")
        print(f"  - JSON: {report_file}")
        print(f"  - Markdown: {markdown_file}")
    
    def generate_recommendations(self, total_requirements, total_workload):
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
    
    def generate_markdown_report(self, report):
        """生成Markdown格式的报告"""
        md_content = f"""# BJT产品管理系统二期需求综合分析报告

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
            if 'requirements' in data:
                md_content += f"### {system_name}\n"
                md_content += f"- **需求数量**: {len(data['requirements'])} 个\n"
                md_content += f"- **工作量**: {data.get('estimated_workload', 0)} 天\n"
                
                if data['requirements']:
                    avg_days = round(data.get('estimated_workload', 0) / len(data['requirements']), 1)
                    md_content += f"- **平均每个需求**: {avg_days} 天\n"
                
                md_content += "\n"
        
        md_content += "## 📝 详细需求列表\n\n"
        
        for system_name, data in report['systems_analysis'].items():
            if 'requirements' in data and data['requirements']:
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

def main():
    excel_file = 'generated_sql_imports/选型网站二期需求和问题记录.xlsx'
    
    if not os.path.exists(excel_file):
        print(f"❌ Excel文件不存在: {excel_file}")
        return
    
    analyzer = DeepRequirementsAnalyzer(excel_file)
    success = analyzer.analyze_all_requirements()
    
    if success:
        print("\n🎉 深度需求分析完成！")
        print("📁 输出目录: output/phase2-requirements")
    else:
        print("\n❌ 深度需求分析失败！")

if __name__ == "__main__":
    main() 