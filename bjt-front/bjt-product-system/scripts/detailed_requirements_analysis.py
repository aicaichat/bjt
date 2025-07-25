#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
二期需求清单逐条分析脚本
为每个需求提供详细的研发时间评估
"""

import pandas as pd
import json
import os
from datetime import datetime
from typing import Dict, List, Any

class DetailedRequirementsAnalyzer:
    def __init__(self):
        self.output_dir = 'output/detailed-requirements-analysis'
        self.requirements = []
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
    def analyze_requirements(self):
        """分析二期需求清单"""
        excel_file = 'generated_sql_imports/选型网站二期需求和问题.csv.xlsx'
        
        print("🔍 开始逐条分析二期需求清单...")
        
        try:
            # 读取Excel文件
            xl = pd.ExcelFile(excel_file)
            df = pd.read_excel(xl, sheet_name='二期需求清单')
            df = df.dropna(how='all')
            
            print(f"✅ 成功读取二期需求清单，共 {len(df)} 行数据")
            
            # 逐条分析需求
            for index, row in df.iterrows():
                requirement = self.analyze_single_requirement(row, index + 1)
                if requirement:
                    self.requirements.append(requirement)
            
            print(f"✅ 成功分析 {len(self.requirements)} 个需求")
            
            # 生成详细报告
            self.generate_detailed_report()
            
        except Exception as e:
            print(f"❌ 分析失败: {e}")
    
    def analyze_single_requirement(self, row, index):
        """分析单个需求"""
        requirement = {
            'id': f"P2_{index:02d}",
            'description': '',
            'category': '',
            'priority': '',
            'status': '',
            'estimated_days': 0,
            'complexity': 'medium',
            'type': 'feature',
            'frontend_days': 0,
            'backend_days': 0,
            'database_days': 0,
            'testing_days': 0,
            'risk_level': 'medium',
            'dependencies': [],
            'notes': ''
        }
        
        # 提取基本信息
        for col in row.index:
            if pd.notna(row[col]):
                value = str(row[col]).strip()
                if value:
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
        
        if not requirement['description']:
            return None
        
        # 详细分析需求
        self.detailed_analysis(requirement)
        
        return requirement
    
    def detailed_analysis(self, requirement):
        """详细分析需求"""
        description = requirement['description'].lower()
        
        # 分析需求类型
        requirement['type'] = self.classify_requirement_type(description)
        
        # 分析复杂度
        requirement['complexity'] = self.assess_complexity(description)
        
        # 分析风险等级
        requirement['risk_level'] = self.assess_risk_level(description, requirement['complexity'])
        
        # 分析依赖关系
        requirement['dependencies'] = self.identify_dependencies(description)
        
        # 详细时间估算
        time_breakdown = self.estimate_detailed_time(requirement)
        requirement.update(time_breakdown)
        
        # 添加备注
        requirement['notes'] = self.generate_notes(requirement)
    
    def classify_requirement_type(self, description):
        """分类需求类型"""
        if any(keyword in description for keyword in ['bug', '错误', '修复', '问题']):
            return 'bug_fix'
        elif any(keyword in description for keyword in ['优化', '改进', '提升']):
            return 'optimization'
        elif any(keyword in description for keyword in ['新增', '添加', '创建', '增加']):
            return 'new_feature'
        elif any(keyword in description for keyword in ['修改', '调整', '更改']):
            return 'modification'
        else:
            return 'feature'
    
    def assess_complexity(self, description):
        """评估复杂度"""
        if any(keyword in description for keyword in ['简单', '显示', '格式', '单位', '标签']):
            return 'low'
        elif any(keyword in description for keyword in ['复杂', '系统', '集成', '流程', 'API', '支付', '邮件']):
            return 'high'
        else:
            return 'medium'
    
    def assess_risk_level(self, description, complexity):
        """评估风险等级"""
        if complexity == 'high' or any(keyword in description for keyword in ['支付', '邮件', '集成', 'API']):
            return 'high'
        elif complexity == 'low' and '显示' in description:
            return 'low'
        else:
            return 'medium'
    
    def identify_dependencies(self, description):
        """识别依赖关系"""
        dependencies = []
        
        if any(keyword in description for keyword in ['用户', '登录', '权限']):
            dependencies.append('用户系统')
        
        if any(keyword in description for keyword in ['购物车', '订单', '支付']):
            dependencies.append('订单系统')
        
        if any(keyword in description for keyword in ['搜索', '筛选']):
            dependencies.append('搜索系统')
        
        if any(keyword in description for keyword in ['邮件', '通知']):
            dependencies.append('邮件系统')
        
        if any(keyword in description for keyword in ['图片', '上传', 'OSS']):
            dependencies.append('文件系统')
        
        return dependencies
    
    def estimate_detailed_time(self, requirement):
        """详细时间估算"""
        description = requirement['description'].lower()
        complexity = requirement['complexity']
        req_type = requirement['type']
        
        # 基础时间估算
        base_frontend = 0
        base_backend = 0
        base_database = 0
        base_testing = 0
        
        # 根据需求类型和描述调整时间
        if '字段' in description or '显示' in description or '格式' in description:
            base_frontend = 0.5
            base_backend = 0.2
            base_testing = 0.3
        elif '页面' in description or '界面' in description or '表单' in description:
            base_frontend = 1.5
            base_backend = 0.5
            base_testing = 0.5
        elif '功能' in description or '流程' in description:
            base_frontend = 1.0
            base_backend = 1.0
            base_testing = 0.5
        elif 'API' in description or '接口' in description:
            base_frontend = 0.5
            base_backend = 1.5
            base_testing = 0.5
        elif '数据库' in description or '表' in description:
            base_backend = 0.5
            base_database = 1.0
            base_testing = 0.3
        elif '购物车' in description or '订单' in description:
            base_frontend = 1.0
            base_backend = 1.5
            base_database = 0.5
            base_testing = 0.5
        elif '用户' in description or '权限' in description:
            base_frontend = 1.0
            base_backend = 1.0
            base_database = 0.5
            base_testing = 0.5
        elif '搜索' in description:
            base_frontend = 1.0
            base_backend = 1.5
            base_testing = 0.5
        elif '邮件' in description:
            base_backend = 2.0
            base_testing = 0.5
        elif '支付' in description:
            base_frontend = 1.0
            base_backend = 2.0
            base_testing = 1.0
        elif '图片' in description or '上传' in description:
            base_frontend = 0.5
            base_backend = 1.0
            base_testing = 0.3
        else:
            base_frontend = 0.5
            base_backend = 0.5
            base_testing = 0.3
        
        # 根据复杂度调整
        if complexity == 'high':
            base_frontend *= 1.5
            base_backend *= 1.5
            base_database *= 1.5
            base_testing *= 1.3
        elif complexity == 'low':
            base_frontend *= 0.7
            base_backend *= 0.7
            base_database *= 0.7
            base_testing *= 0.8
        
        # 根据需求类型调整
        if req_type == 'bug_fix':
            base_frontend *= 0.8
            base_backend *= 0.8
            base_testing *= 1.2
        elif req_type == 'optimization':
            base_frontend *= 0.9
            base_backend *= 0.9
            base_testing *= 1.1
        elif req_type == 'new_feature':
            base_frontend *= 1.2
            base_backend *= 1.2
            base_testing *= 1.1
        
        # 计算总时间
        total_days = base_frontend + base_backend + base_database + base_testing
        
        return {
            'frontend_days': round(base_frontend, 1),
            'backend_days': round(base_backend, 1),
            'database_days': round(base_database, 1),
            'testing_days': round(base_testing, 1),
            'estimated_days': round(total_days, 1)
        }
    
    def generate_notes(self, requirement):
        """生成备注"""
        notes = []
        
        if requirement['complexity'] == 'high':
            notes.append("复杂度较高，需要仔细设计")
        
        if requirement['risk_level'] == 'high':
            notes.append("风险较高，需要充分测试")
        
        if requirement['dependencies']:
            notes.append(f"依赖: {', '.join(requirement['dependencies'])}")
        
        if requirement['type'] == 'bug_fix':
            notes.append("Bug修复，需要回归测试")
        
        if requirement['type'] == 'new_feature':
            notes.append("新功能，需要完整测试")
        
        return '; '.join(notes) if notes else "标准开发流程"
    
    def generate_detailed_report(self):
        """生成详细报告"""
        print("\n📊 生成详细分析报告...")
        
        # 计算统计信息
        total_days = sum(req['estimated_days'] for req in self.requirements)
        total_frontend = sum(req['frontend_days'] for req in self.requirements)
        total_backend = sum(req['backend_days'] for req in self.requirements)
        total_database = sum(req['database_days'] for req in self.requirements)
        total_testing = sum(req['testing_days'] for req in self.requirements)
        
        # 按类型统计
        type_stats = {}
        complexity_stats = {}
        risk_stats = {}
        
        for req in self.requirements:
            req_type = req['type']
            complexity = req['complexity']
            risk = req['risk_level']
            
            if req_type not in type_stats:
                type_stats[req_type] = {'count': 0, 'days': 0}
            type_stats[req_type]['count'] += 1
            type_stats[req_type]['days'] += req['estimated_days']
            
            if complexity not in complexity_stats:
                complexity_stats[complexity] = {'count': 0, 'days': 0}
            complexity_stats[complexity]['count'] += 1
            complexity_stats[complexity]['days'] += req['estimated_days']
            
            if risk not in risk_stats:
                risk_stats[risk] = {'count': 0, 'days': 0}
            risk_stats[risk]['count'] += 1
            risk_stats[risk]['days'] += req['estimated_days']
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_requirements': len(self.requirements),
                'total_days': total_days,
                'estimated_months': round(total_days / 20, 1),
                'frontend_days': total_frontend,
                'backend_days': total_backend,
                'database_days': total_database,
                'testing_days': total_testing
            },
            'statistics': {
                'by_type': type_stats,
                'by_complexity': complexity_stats,
                'by_risk': risk_stats
            },
            'requirements': self.requirements
        }
        
        # 保存详细报告
        report_file = os.path.join(self.output_dir, 'detailed_requirements_analysis.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成Markdown报告
        markdown_report = self.generate_markdown_report(report)
        markdown_file = os.path.join(self.output_dir, 'detailed_requirements_analysis.md')
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        # 生成Excel格式的详细列表
        self.generate_excel_report()
        
        print(f"✅ 详细分析报告已保存到:")
        print(f"  - JSON: {report_file}")
        print(f"  - Markdown: {markdown_file}")
        print(f"  - Excel: {os.path.join(self.output_dir, 'requirements_detailed_list.xlsx')}")
    
    def generate_markdown_report(self, report):
        """生成Markdown格式的报告"""
        md_content = f"""# 二期需求清单逐条分析报告

## 📋 报告概览

- **生成时间**: {report['generated_at']}
- **总需求数**: {report['summary']['total_requirements']} 个
- **总工作量**: {report['summary']['total_days']} 天
- **预计工期**: {report['summary']['estimated_months']} 个月

## 📊 工作量分布

### 按开发阶段
- **前端开发**: {report['summary']['frontend_days']} 天 ({round(report['summary']['frontend_days']/report['summary']['total_days']*100, 1)}%)
- **后端开发**: {report['summary']['backend_days']} 天 ({round(report['summary']['backend_days']/report['summary']['total_days']*100, 1)}%)
- **数据库**: {report['summary']['database_days']} 天 ({round(report['summary']['database_days']/report['summary']['total_days']*100, 1)}%)
- **测试**: {report['summary']['testing_days']} 天 ({round(report['summary']['testing_days']/report['summary']['total_days']*100, 1)}%)

### 按需求类型
"""
        
        for req_type, stats in report['statistics']['by_type'].items():
            percentage = round(stats['days'] / report['summary']['total_days'] * 100, 1)
            md_content += f"- **{req_type.replace('_', ' ').title()}**: {stats['count']} 个, {stats['days']} 天 ({percentage}%)\n"
        
        md_content += "\n### 按复杂度\n"
        
        for complexity, stats in report['statistics']['by_complexity'].items():
            percentage = round(stats['days'] / report['summary']['total_days'] * 100, 1)
            md_content += f"- **{complexity.title()}**: {stats['count']} 个, {stats['days']} 天 ({percentage}%)\n"
        
        md_content += "\n### 按风险等级\n"
        
        for risk, stats in report['statistics']['by_risk'].items():
            percentage = round(stats['days'] / report['summary']['total_days'] * 100, 1)
            md_content += f"- **{risk.title()}**: {stats['count']} 个, {stats['days']} 天 ({percentage}%)\n"
        
        md_content += "\n## 📝 详细需求列表\n\n"
        
        for req in report['requirements']:
            md_content += f"### {req['id']}\n"
            md_content += f"- **描述**: {req['description']}\n"
            if req['category']:
                md_content += f"- **分类**: {req['category']}\n"
            if req['priority']:
                md_content += f"- **优先级**: {req['priority']}\n"
            md_content += f"- **类型**: {req['type'].replace('_', ' ').title()}\n"
            md_content += f"- **复杂度**: {req['complexity'].title()}\n"
            md_content += f"- **风险等级**: {req['risk_level'].title()}\n"
            md_content += f"- **总工作量**: {req['estimated_days']} 天\n"
            md_content += f"  - 前端: {req['frontend_days']} 天\n"
            md_content += f"  - 后端: {req['backend_days']} 天\n"
            md_content += f"  - 数据库: {req['database_days']} 天\n"
            md_content += f"  - 测试: {req['testing_days']} 天\n"
            if req['dependencies']:
                md_content += f"- **依赖**: {', '.join(req['dependencies'])}\n"
            md_content += f"- **备注**: {req['notes']}\n\n"
        
        return md_content
    
    def generate_excel_report(self):
        """生成Excel格式的详细列表"""
        # 准备数据
        data = []
        for req in self.requirements:
            data.append({
                '需求ID': req['id'],
                '描述': req['description'],
                '分类': req['category'],
                '优先级': req['priority'],
                '状态': req['status'],
                '需求类型': req['type'],
                '复杂度': req['complexity'],
                '风险等级': req['risk_level'],
                '总工作量(天)': req['estimated_days'],
                '前端(天)': req['frontend_days'],
                '后端(天)': req['backend_days'],
                '数据库(天)': req['database_days'],
                '测试(天)': req['testing_days'],
                '依赖关系': ', '.join(req['dependencies']),
                '备注': req['notes']
            })
        
        # 创建DataFrame并保存
        df = pd.DataFrame(data)
        excel_file = os.path.join(self.output_dir, 'requirements_detailed_list.xlsx')
        df.to_excel(excel_file, index=False, engine='openpyxl')
        
        print(f"✅ Excel详细列表已保存到: {excel_file}")

def main():
    analyzer = DetailedRequirementsAnalyzer()
    analyzer.analyze_requirements()
    print("\n🎉 二期需求逐条分析完成！")

if __name__ == "__main__":
    main() 