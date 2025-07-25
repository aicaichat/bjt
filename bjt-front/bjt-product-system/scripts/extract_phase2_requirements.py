#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BJT产品管理系统二期需求提取脚本
从Excel文件中提取和分析二期需求信息
"""

import pandas as pd
import json
import os
from datetime import datetime
from typing import Dict, List, Any
import argparse

class Phase2RequirementsExtractor:
    def __init__(self, excel_file: str):
        self.excel_file = excel_file
        self.output_dir = "output/phase2-requirements"
        self.requirements_data = {}
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
    def extract_all_requirements(self):
        """提取所有工作表的需求信息"""
        print("🔍 开始提取二期需求信息...")
        
        # 读取Excel文件
        try:
            xl = pd.ExcelFile(self.excel_file)
            print(f"✅ 成功读取Excel文件，包含工作表: {xl.sheet_names}")
        except Exception as e:
            print(f"❌ 读取Excel文件失败: {e}")
            return False
            
        # 提取二期需求清单
        self.extract_phase2_requirements_list(xl)
        
        # 提取各系统需求
        self.extract_system_requirements(xl)
        
        # 生成分析报告
        self.generate_analysis_report()
        
        return True
    
    def extract_phase2_requirements_list(self, xl):
        """提取二期需求清单"""
        print("\n📋 提取二期需求清单...")
        
        try:
            df = pd.read_excel(xl, sheet_name='二期需求清单')
            print(f"✅ 二期需求清单数据形状: {df.shape}")
            
            # 清理数据
            df = df.dropna(how='all')
            
            # 保存原始数据
            self.requirements_data['phase2_list'] = df.to_dict('records')
            
            # 分析需求分类
            requirements_by_category = self.analyze_requirements_by_category(df)
            self.requirements_data['requirements_by_category'] = requirements_by_category
            
            # 保存到文件
            output_file = os.path.join(self.output_dir, 'phase2_requirements_list.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.requirements_data['phase2_list'], f, ensure_ascii=False, indent=2)
            
            print(f"✅ 二期需求清单已保存到: {output_file}")
            
        except Exception as e:
            print(f"❌ 提取二期需求清单失败: {e}")
    
    def extract_system_requirements(self, xl):
        """提取各系统需求"""
        system_sheets = ['选型网站首页', '购物流程', '气垫系统', '纸垫系统', '温水胶带系统', '后台']
        
        print("\n🔧 提取各系统需求...")
        
        for sheet_name in system_sheets:
            if sheet_name in xl.sheet_names:
                print(f"📊 处理工作表: {sheet_name}")
                self.extract_single_system_requirements(xl, sheet_name)
    
    def extract_single_system_requirements(self, xl, sheet_name):
        """提取单个系统的需求"""
        try:
            df = pd.read_excel(xl, sheet_name=sheet_name)
            print(f"  - 数据形状: {df.shape}")
            
            # 清理数据
            df = df.dropna(how='all')
            
            # 分析需求
            system_analysis = self.analyze_system_requirements(df, sheet_name)
            
            # 保存数据
            self.requirements_data[sheet_name] = {
                'raw_data': df.to_dict('records'),
                'analysis': system_analysis
            }
            
            # 保存到文件
            output_file = os.path.join(self.output_dir, f'{sheet_name}_requirements.json')
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(self.requirements_data[sheet_name], f, ensure_ascii=False, indent=2)
            
            print(f"  ✅ 已保存到: {output_file}")
            
        except Exception as e:
            print(f"  ❌ 处理工作表 {sheet_name} 失败: {e}")
    
    def analyze_requirements_by_category(self, df):
        """分析需求分类"""
        analysis = {
            'total_count': len(df),
            'categories': {},
            'priority_distribution': {},
            'status_distribution': {}
        }
        
        # 分析分类
        if '分类' in df.columns:
            category_counts = df['分类'].value_counts()
            analysis['categories'] = category_counts.to_dict()
        
        # 分析优先级
        if '优先级' in df.columns:
            priority_counts = df['优先级'].value_counts()
            analysis['priority_distribution'] = priority_counts.to_dict()
        
        # 分析状态
        if '状态' in df.columns:
            status_counts = df['状态'].value_counts()
            analysis['status_distribution'] = status_counts.to_dict()
        
        return analysis
    
    def analyze_system_requirements(self, df, system_name):
        """分析系统需求"""
        analysis = {
            'system_name': system_name,
            'total_count': len(df),
            'columns': list(df.columns),
            'data_types': df.dtypes.to_dict(),
            'missing_data': df.isnull().sum().to_dict(),
            'unique_values': {}
        }
        
        # 分析每列的唯一值
        for col in df.columns:
            if df[col].dtype == 'object':
                unique_vals = df[col].value_counts().head(10).to_dict()
                analysis['unique_values'][col] = unique_vals
        
        return analysis
    
    def generate_analysis_report(self):
        """生成分析报告"""
        print("\n📊 生成分析报告...")
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'excel_file': self.excel_file,
            'summary': self.generate_summary(),
            'detailed_analysis': self.generate_detailed_analysis(),
            'recommendations': self.generate_recommendations()
        }
        
        # 保存完整报告
        report_file = os.path.join(self.output_dir, 'phase2_requirements_analysis_report.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成Markdown报告
        markdown_report = self.generate_markdown_report(report)
        markdown_file = os.path.join(self.output_dir, 'phase2_requirements_analysis_report.md')
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        print(f"✅ 分析报告已保存到:")
        print(f"  - JSON: {report_file}")
        print(f"  - Markdown: {markdown_file}")
    
    def generate_summary(self):
        """生成摘要"""
        summary = {
            'total_systems': len([k for k in self.requirements_data.keys() if k != 'phase2_list']),
            'total_requirements': 0,
            'systems_covered': []
        }
        
        for system_name, data in self.requirements_data.items():
            if system_name != 'phase2_list':
                summary['systems_covered'].append(system_name)
                if 'analysis' in data:
                    summary['total_requirements'] += data['analysis'].get('total_count', 0)
        
        return summary
    
    def generate_detailed_analysis(self):
        """生成详细分析"""
        analysis = {}
        
        for system_name, data in self.requirements_data.items():
            if system_name != 'phase2_list':
                analysis[system_name] = data.get('analysis', {})
        
        return analysis
    
    def generate_recommendations(self):
        """生成建议"""
        recommendations = {
            'priority_actions': [],
            'technical_considerations': [],
            'timeline_suggestions': []
        }
        
        # 基于分析结果生成建议
        total_requirements = 0
        for system_name, data in self.requirements_data.items():
            if system_name != 'phase2_list' and 'analysis' in data:
                total_requirements += data['analysis'].get('total_count', 0)
        
        if total_requirements > 100:
            recommendations['priority_actions'].append("需求数量较多，建议分阶段实施")
            recommendations['timeline_suggestions'].append("预计需要6-8个月完成所有需求")
        else:
            recommendations['priority_actions'].append("需求数量适中，可以集中实施")
            recommendations['timeline_suggestions'].append("预计需要3-4个月完成所有需求")
        
        return recommendations
    
    def generate_markdown_report(self, report):
        """生成Markdown格式的报告"""
        md_content = f"""# BJT产品管理系统二期需求分析报告

## 📋 报告概览

- **生成时间**: {report['generated_at']}
- **数据源**: {report['excel_file']}
- **总系统数**: {report['summary']['total_systems']}
- **总需求数**: {report['summary']['total_requirements']}

## 🎯 系统覆盖范围

"""
        
        for system in report['summary']['systems_covered']:
            md_content += f"- **{system}**\n"
        
        md_content += "\n## 📊 详细分析\n\n"
        
        for system_name, analysis in report['detailed_analysis'].items():
            md_content += f"### {system_name}\n\n"
            md_content += f"- **需求总数**: {analysis.get('total_count', 0)}\n"
            md_content += f"- **数据列数**: {len(analysis.get('columns', []))}\n"
            
            # 显示缺失数据情况
            missing_data = analysis.get('missing_data', {})
            if missing_data:
                md_content += "- **数据缺失情况**:\n"
                for col, missing_count in missing_data.items():
                    if missing_count > 0:
                        md_content += f"  - {col}: {missing_count} 条缺失\n"
            
            md_content += "\n"
        
        md_content += "## 💡 建议\n\n"
        
        for category, suggestions in report['recommendations'].items():
            md_content += f"### {category.replace('_', ' ').title()}\n\n"
            for suggestion in suggestions:
                md_content += f"- {suggestion}\n"
            md_content += "\n"
        
        return md_content

def main():
    parser = argparse.ArgumentParser(description='提取BJT产品管理系统二期需求')
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
    
    # 创建提取器并执行
    extractor = Phase2RequirementsExtractor(args.excel_file)
    success = extractor.extract_all_requirements()
    
    if success:
        print("\n🎉 需求提取完成！")
        print(f"📁 输出目录: {args.output_dir}")
    else:
        print("\n❌ 需求提取失败！")

if __name__ == "__main__":
    main() 