#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BJT产品管理系统二期需求最终工作量评估脚本
基于提取的需求数据生成详细的工作量和成本评估
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any

class FinalWorkloadAnalyzer:
    def __init__(self):
        self.output_dir = 'output/phase2-requirements'
        self.requirements_data = {}
        self.workload_analysis = {}
        
    def load_requirements_data(self):
        """加载需求数据"""
        print("📂 加载需求数据...")
        
        # 加载二期需求清单
        phase2_file = os.path.join(self.output_dir, 'phase2_requirements_analysis.json')
        if os.path.exists(phase2_file):
            with open(phase2_file, 'r', encoding='utf-8') as f:
                self.requirements_data['phase2_list'] = json.load(f)
            print(f"✅ 加载二期需求清单: {len(self.requirements_data['phase2_list']['requirements'])} 个需求")
        
        # 加载各系统需求
        system_files = [
            '选型网站首页_analysis.json',
            '购物流程_analysis.json', 
            '气垫系统_analysis.json',
            '纸垫系统_analysis.json',
            '温水胶带系统_analysis.json',
            '后台_analysis.json'
        ]
        
        for file_name in system_files:
            file_path = os.path.join(self.output_dir, file_name)
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    system_name = file_name.replace('_analysis.json', '')
                    self.requirements_data[system_name] = json.load(f)
                print(f"✅ 加载 {system_name}: {len(self.requirements_data[system_name]['requirements'])} 个需求")
    
    def analyze_workload_by_category(self):
        """按分类分析工作量"""
        print("\n📊 按分类分析工作量...")
        
        categories = {}
        total_workload = 0
        
        for system_name, data in self.requirements_data.items():
            if 'requirements' in data:
                for req in data['requirements']:
                    category = req.get('category', '未分类')
                    days = req.get('estimated_days', 0)
                    
                    if category not in categories:
                        categories[category] = {
                            'count': 0,
                            'total_days': 0,
                            'requirements': []
                        }
                    
                    categories[category]['count'] += 1
                    categories[category]['total_days'] += days
                    categories[category]['requirements'].append({
                        'id': req['id'],
                        'description': req['description'],
                        'days': days,
                        'system': system_name
                    })
                    
                    total_workload += days
        
        self.workload_analysis['by_category'] = {
            'categories': categories,
            'total_workload': total_workload
        }
        
        print(f"✅ 分类分析完成，共 {len(categories)} 个分类，总工作量 {total_workload} 天")
    
    def analyze_workload_by_priority(self):
        """按优先级分析工作量"""
        print("\n🎯 按优先级分析工作量...")
        
        priorities = {
            '高': {'count': 0, 'total_days': 0, 'requirements': []},
            '中': {'count': 0, 'total_days': 0, 'requirements': []},
            '低': {'count': 0, 'total_days': 0, 'requirements': []},
            '未设置': {'count': 0, 'total_days': 0, 'requirements': []}
        }
        
        for system_name, data in self.requirements_data.items():
            if 'requirements' in data:
                for req in data['requirements']:
                    priority = req.get('priority', '未设置')
                    days = req.get('estimated_days', 0)
                    
                    if priority not in priorities:
                        priority = '未设置'
                    
                    priorities[priority]['count'] += 1
                    priorities[priority]['total_days'] += days
                    priorities[priority]['requirements'].append({
                        'id': req['id'],
                        'description': req['description'],
                        'days': days,
                        'system': system_name
                    })
        
        self.workload_analysis['by_priority'] = priorities
    
    def analyze_workload_by_type(self):
        """按需求类型分析工作量"""
        print("\n🔧 按需求类型分析工作量...")
        
        types = {
            'feature': {'count': 0, 'total_days': 0, 'requirements': []},
            'bug_fix': {'count': 0, 'total_days': 0, 'requirements': []},
            'optimization': {'count': 0, 'total_days': 0, 'requirements': []},
            'new_feature': {'count': 0, 'total_days': 0, 'requirements': []}
        }
        
        for system_name, data in self.requirements_data.items():
            if 'requirements' in data:
                for req in data['requirements']:
                    req_type = req.get('type', 'feature')
                    days = req.get('estimated_days', 0)
                    
                    if req_type not in types:
                        req_type = 'feature'
                    
                    types[req_type]['count'] += 1
                    types[req_type]['total_days'] += days
                    types[req_type]['requirements'].append({
                        'id': req['id'],
                        'description': req['description'],
                        'days': days,
                        'system': system_name
                    })
        
        self.workload_analysis['by_type'] = types
    
    def generate_implementation_plan(self):
        """生成实施计划"""
        print("\n📋 生成实施计划...")
        
        # 计算总体工作量
        total_workload = self.workload_analysis['by_category']['total_workload']
        
        # 按优先级排序的需求
        high_priority = self.workload_analysis['by_priority']['高']['requirements']
        medium_priority = self.workload_analysis['by_priority']['中']['requirements']
        low_priority = self.workload_analysis['by_priority']['低']['requirements']
        
        # 生成阶段计划
        phases = {
            'phase1': {
                'name': '第一阶段 - 核心功能',
                'duration': '2-3个月',
                'requirements': high_priority,
                'total_days': sum(req['days'] for req in high_priority),
                'focus': '高优先级核心功能'
            },
            'phase2': {
                'name': '第二阶段 - 功能完善',
                'duration': '2-3个月',
                'requirements': medium_priority,
                'total_days': sum(req['days'] for req in medium_priority),
                'focus': '中优先级功能完善'
            },
            'phase3': {
                'name': '第三阶段 - 优化提升',
                'duration': '1-2个月',
                'requirements': low_priority,
                'total_days': sum(req['days'] for req in low_priority),
                'focus': '低优先级优化提升'
            }
        }
        
        self.workload_analysis['implementation_plan'] = {
            'total_workload': total_workload,
            'estimated_months': round(total_workload / 20, 1),
            'phases': phases,
            'resource_recommendation': self.get_resource_recommendation(total_workload)
        }
    
    def get_resource_recommendation(self, total_workload):
        """获取资源建议"""
        if total_workload > 100:
            return {
                'developers': '3-4名',
                'testers': '1-2名',
                'project_manager': '1名',
                'total_team_size': '5-7人'
            }
        elif total_workload > 50:
            return {
                'developers': '2-3名',
                'testers': '1名',
                'project_manager': '1名',
                'total_team_size': '4-5人'
            }
        else:
            return {
                'developers': '1-2名',
                'testers': '1名',
                'project_manager': '1名',
                'total_team_size': '3-4人'
            }
    
    def calculate_cost_estimate(self):
        """计算成本估算"""
        print("\n💰 计算成本估算...")
        
        total_workload = self.workload_analysis['by_category']['total_workload']
        
        # 成本估算（按天计算）
        cost_rates = {
            'senior_developer': 2000,  # 高级开发 2000元/天
            'developer': 1500,         # 开发 1500元/天
            'tester': 1000,            # 测试 1000元/天
            'project_manager': 2500    # 项目经理 2500元/天
        }
        
        # 团队配置建议
        resource_rec = self.workload_analysis['implementation_plan']['resource_recommendation']
        
        # 成本计算
        if total_workload > 100:
            # 大项目配置
            team_cost = {
                'senior_developer': {'count': 2, 'days': total_workload, 'rate': cost_rates['senior_developer']},
                'developer': {'count': 2, 'days': total_workload, 'rate': cost_rates['developer']},
                'tester': {'count': 1, 'days': total_workload * 0.3, 'rate': cost_rates['tester']},
                'project_manager': {'count': 1, 'days': total_workload * 0.2, 'rate': cost_rates['project_manager']}
            }
        elif total_workload > 50:
            # 中等项目配置
            team_cost = {
                'senior_developer': {'count': 1, 'days': total_workload, 'rate': cost_rates['senior_developer']},
                'developer': {'count': 2, 'days': total_workload, 'rate': cost_rates['developer']},
                'tester': {'count': 1, 'days': total_workload * 0.3, 'rate': cost_rates['tester']},
                'project_manager': {'count': 1, 'days': total_workload * 0.2, 'rate': cost_rates['project_manager']}
            }
        else:
            # 小项目配置
            team_cost = {
                'developer': {'count': 2, 'days': total_workload, 'rate': cost_rates['developer']},
                'tester': {'count': 1, 'days': total_workload * 0.3, 'rate': cost_rates['tester']},
                'project_manager': {'count': 1, 'days': total_workload * 0.2, 'rate': cost_rates['project_manager']}
            }
        
        # 计算总成本
        total_cost = 0
        for role, config in team_cost.items():
            role_cost = config['count'] * config['days'] * config['rate']
            total_cost += role_cost
        
        self.workload_analysis['cost_estimate'] = {
            'total_cost': round(total_cost, 2),
            'cost_per_day': round(total_cost / total_workload, 2),
            'team_cost_breakdown': team_cost,
            'cost_rates': cost_rates
        }
    
    def generate_final_report(self):
        """生成最终报告"""
        print("\n📊 生成最终报告...")
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_requirements': sum(len(data['requirements']) for data in self.requirements_data.values() if 'requirements' in data),
                'total_workload_days': self.workload_analysis['by_category']['total_workload'],
                'estimated_months': self.workload_analysis['implementation_plan']['estimated_months'],
                'estimated_cost': self.workload_analysis['cost_estimate']['total_cost']
            },
            'workload_analysis': self.workload_analysis,
            'recommendations': self.generate_recommendations()
        }
        
        # 保存JSON报告
        report_file = os.path.join(self.output_dir, 'final_workload_analysis.json')
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        # 生成Markdown报告
        markdown_report = self.generate_markdown_report(report)
        markdown_file = os.path.join(self.output_dir, 'final_workload_analysis.md')
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        print(f"✅ 最终报告已保存到:")
        print(f"  - JSON: {report_file}")
        print(f"  - Markdown: {markdown_file}")
    
    def generate_recommendations(self):
        """生成建议"""
        total_workload = self.workload_analysis['by_category']['total_workload']
        
        recommendations = {
            'timeline': [
                f"总工作量 {total_workload} 天，建议分3个阶段实施",
                f"预计总工期 {self.workload_analysis['implementation_plan']['estimated_months']} 个月",
                "第一阶段专注高优先级核心功能",
                "第二阶段完善中优先级功能",
                "第三阶段进行低优先级优化"
            ],
            'resource_allocation': [
                f"建议团队规模: {self.workload_analysis['implementation_plan']['resource_recommendation']['total_team_size']}",
                "优先分配资深开发人员处理复杂需求",
                "测试人员建议在开发后期介入",
                "项目经理负责整体协调和进度把控"
            ],
            'risk_mitigation': [
                "高优先级需求较多，建议增加技术评审时间",
                "复杂需求需要提前进行技术可行性评估",
                "建议建立需求变更管理流程",
                "定期进行进度评估和风险识别"
            ],
            'cost_optimization': [
                f"预计总成本: ¥{self.workload_analysis['cost_estimate']['total_cost']:,.2f}",
                "可通过并行开发优化成本",
                "建议采用敏捷开发模式提高效率",
                "考虑外包部分低复杂度需求"
            ]
        }
        
        return recommendations
    
    def generate_markdown_report(self, report):
        """生成Markdown格式的报告"""
        md_content = f"""# BJT产品管理系统二期需求最终工作量评估报告

## 📋 报告概览

- **生成时间**: {report['generated_at']}
- **总需求数**: {report['summary']['total_requirements']} 个
- **总工作量**: {report['summary']['total_workload_days']} 天
- **预计工期**: {report['summary']['estimated_months']} 个月
- **预计成本**: ¥{report['summary']['estimated_cost']:,.2f}

## 🎯 工作量分析

### 按分类分布

"""
        
        categories = report['workload_analysis']['by_category']['categories']
        for category, data in categories.items():
            percentage = round(data['total_days'] / report['summary']['total_workload_days'] * 100, 1)
            md_content += f"#### {category}\n"
            md_content += f"- **需求数量**: {data['count']} 个\n"
            md_content += f"- **工作量**: {data['total_days']} 天 ({percentage}%)\n\n"
        
        md_content += "### 按优先级分布\n\n"
        
        priorities = report['workload_analysis']['by_priority']
        for priority, data in priorities.items():
            if data['count'] > 0:
                percentage = round(data['total_days'] / report['summary']['total_workload_days'] * 100, 1)
                md_content += f"#### {priority}优先级\n"
                md_content += f"- **需求数量**: {data['count']} 个\n"
                md_content += f"- **工作量**: {data['total_days']} 天 ({percentage}%)\n\n"
        
        md_content += "### 按需求类型分布\n\n"
        
        types = report['workload_analysis']['by_type']
        for req_type, data in types.items():
            if data['count'] > 0:
                percentage = round(data['total_days'] / report['summary']['total_workload_days'] * 100, 1)
                md_content += f"#### {req_type.title()}\n"
                md_content += f"- **需求数量**: {data['count']} 个\n"
                md_content += f"- **工作量**: {data['total_days']} 天 ({percentage}%)\n\n"
        
        md_content += "## 📋 实施计划\n\n"
        
        phases = report['workload_analysis']['implementation_plan']['phases']
        for phase_key, phase_data in phases.items():
            md_content += f"### {phase_data['name']}\n"
            md_content += f"- **工期**: {phase_data['duration']}\n"
            md_content += f"- **工作量**: {phase_data['total_days']} 天\n"
            md_content += f"- **重点**: {phase_data['focus']}\n"
            md_content += f"- **需求数量**: {len(phase_data['requirements'])} 个\n\n"
        
        md_content += "## 💰 成本估算\n\n"
        
        cost_estimate = report['workload_analysis']['cost_estimate']
        md_content += f"- **总成本**: ¥{cost_estimate['total_cost']:,.2f}\n"
        md_content += f"- **平均每天成本**: ¥{cost_estimate['cost_per_day']:,.2f}\n\n"
        
        md_content += "### 团队成本明细\n\n"
        for role, config in cost_estimate['team_cost_breakdown'].items():
            role_cost = config['count'] * config['days'] * config['rate']
            md_content += f"- **{role.replace('_', ' ').title()}**: {config['count']}人 × {config['days']}天 × ¥{config['rate']}/天 = ¥{role_cost:,.2f}\n"
        
        md_content += "\n## 💡 建议\n\n"
        
        for category, suggestions in report['recommendations'].items():
            md_content += f"### {category.replace('_', ' ').title()}\n\n"
            for suggestion in suggestions:
                md_content += f"- {suggestion}\n"
            md_content += "\n"
        
        return md_content
    
    def run_analysis(self):
        """运行完整分析"""
        print("🚀 开始最终工作量分析...")
        
        # 加载数据
        self.load_requirements_data()
        
        # 分析工作量
        self.analyze_workload_by_category()
        self.analyze_workload_by_priority()
        self.analyze_workload_by_type()
        
        # 生成实施计划
        self.generate_implementation_plan()
        
        # 计算成本
        self.calculate_cost_estimate()
        
        # 生成报告
        self.generate_final_report()
        
        print("\n🎉 最终工作量分析完成！")

def main():
    analyzer = FinalWorkloadAnalyzer()
    analyzer.run_analysis()

if __name__ == "__main__":
    main() 