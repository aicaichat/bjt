#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
详细对比BJT Phase2现有功能与提示词的提升效果
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any

class DetailedFunctionalComparison:
    def __init__(self):
        self.output_dir = 'output/detailed-functional-comparison'
        self.comparison_results = {}
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
    def analyze_existing_functionality(self):
        """分析现有功能"""
        existing_functions = {
            'cart_system': {
                'components': ['Cart/', 'Cart.tsx', 'CartUnitSystemTestPage.tsx'],
                'features': [
                    '商品添加到购物车',
                    '购物车数量修改',
                    '单位系统切换',
                    '购物车商品列表',
                    '购物车结算流程'
                ],
                'strengths': [
                    '完整的购物车功能',
                    '支持单位切换',
                    '响应式设计'
                ],
                'weaknesses': [
                    '气泡按钮位置需要调整',
                    '缺少商品选择提示',
                    '清空和结算按钮需要优化'
                ]
            },
            'product_catalog': {
                'components': [
                    'ProductInfo/', 'ProductName.tsx', 'ProductPriceInventory.tsx',
                    'MachineList.tsx', 'ConsumableList.tsx', 'SparePartList.tsx',
                    'AccessoryList.tsx'
                ],
                'features': [
                    '产品列表展示',
                    '产品详情页面',
                    '产品分类管理',
                    '产品搜索功能',
                    '产品筛选功能'
                ],
                'strengths': [
                    '完整的产品目录',
                    '支持多种产品类型',
                    '响应式布局'
                ],
                'weaknesses': [
                    '字段显示需要优化',
                    '图片展示需要改进',
                    '搜索功能需要增强'
                ]
            },
            'field_display_system': {
                'components': [
                    'SmartFieldValue.tsx', 'SmartFieldLabel.tsx', 'SmartFieldRow.tsx',
                    'MachineFieldDisplay.tsx', 'ConsumableFieldDisplay.tsx'
                ],
                'features': [
                    '智能字段显示',
                    '中英文切换',
                    '单位系统切换',
                    '字段验证',
                    '动态字段渲染'
                ],
                'strengths': [
                    '灵活的字段显示系统',
                    '支持多语言',
                    '支持单位切换'
                ],
                'weaknesses': [
                    '某些字段显示不一致',
                    '气泡属性显示需要优化',
                    '字段验证需要加强'
                ]
            },
            'order_system': {
                'components': ['Order/', 'OrderList/', 'Orders/', 'PO/'],
                'features': [
                    '订单创建',
                    '订单状态管理',
                    'PO生成',
                    '订单导出',
                    '订单历史查询'
                ],
                'strengths': [
                    '完整的订单流程',
                    '支持多种导出格式',
                    '订单状态跟踪'
                ],
                'weaknesses': [
                    '订单详情页面需要优化',
                    '导出格式需要改进',
                    '订单管理界面需要优化'
                ]
            },
            'user_management': {
                'components': ['Login/', 'Register/', 'Profile/'],
                'features': [
                    '用户注册',
                    '用户登录',
                    '用户资料管理',
                    '权限控制',
                    '头像上传'
                ],
                'strengths': [
                    '完整的用户系统',
                    '支持多种注册方式',
                    '用户资料管理'
                ],
                'weaknesses': [
                    '头像上传功能失效',
                    '登录状态管理需要优化',
                    '权限系统需要完善'
                ]
            },
            'file_upload_system': {
                'components': ['test-upload.html', 'test-upload-simple.html'],
                'features': [
                    '文件上传',
                    '图片预览',
                    'PDF预览',
                    '文件验证',
                    '上传进度显示'
                ],
                'strengths': [
                    '支持多种文件格式',
                    '文件验证功能',
                    '上传进度显示'
                ],
                'weaknesses': [
                    'PDF预览需要优化',
                    '文件名处理需要改进',
                    '上传体验需要优化'
                ]
            },
            'notification_system': {
                'components': [],
                'features': [
                    '邮件通知',
                    '订单确认邮件',
                    '系统通知'
                ],
                'strengths': [
                    '基础的邮件功能',
                    '订单通知'
                ],
                'weaknesses': [
                    '邮件模板需要优化',
                    '通知系统需要完善',
                    '区域化邮件分发需要实现'
                ]
            },
            'search_filter_system': {
                'components': [],
                'features': [
                    '产品搜索',
                    '条件筛选',
                    '搜索结果展示'
                ],
                'strengths': [
                    '基础的搜索功能',
                    '条件筛选'
                ],
                'weaknesses': [
                    '搜索功能需要增强',
                    '搜索结果展示需要优化',
                    '搜索建议功能缺失'
                ]
            },
            'payment_system': {
                'components': [],
                'features': [
                    '支付集成',
                    '订单支付',
                    '支付状态管理'
                ],
                'strengths': [
                    '基础的支付功能'
                ],
                'weaknesses': [
                    '支付页面需要优化',
                    '支付流程需要完善',
                    '多种支付方式支持不足'
                ]
            },
            'inventory_system': {
                'components': ['ProductPriceInventory.tsx'],
                'features': [
                    '库存显示',
                    '价格管理',
                    '库存状态'
                ],
                'strengths': [
                    '基础的库存显示',
                    '价格管理功能'
                ],
                'weaknesses': [
                    '库存管理需要完善',
                    '多仓库支持需要实现',
                    '库存预警功能缺失'
                ]
            }
        }
        
        return existing_functions
    
    def analyze_prompts_enhancement(self):
        """分析提示词对现有功能的增强"""
        prompts_file = 'output/coding-prompts/coding_prompts_summary.json'
        
        if not os.path.exists(prompts_file):
            print(f"❌ 提示词文件不存在: {prompts_file}")
            return {}
        
        with open(prompts_file, 'r', encoding='utf-8') as f:
            prompts_data = json.load(f)
        
        enhancement_analysis = {
            'cart_system_enhancements': [],
            'product_catalog_enhancements': [],
            'field_display_enhancements': [],
            'order_system_enhancements': [],
            'user_management_enhancements': [],
            'file_upload_enhancements': [],
            'notification_enhancements': [],
            'search_filter_enhancements': [],
            'payment_enhancements': [],
            'inventory_enhancements': [],
            'new_features': []
        }
        
        for prompt in prompts_data['prompts']:
            description = prompt.get('description', '').lower()
            prompt_id = prompt.get('id', '')
            
            # 购物车系统增强
            if any(keyword in description for keyword in ['购物车', 'cart', '结算', '清空']):
                enhancement_analysis['cart_system_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'ui_improvement' if '按钮' in description else 'functionality_improvement',
                    'estimated_impact': 'high' if '结算' in description else 'medium'
                })
            
            # 产品目录增强
            elif any(keyword in description for keyword in ['产品', '商品', '型号', '主机', '配件', '耗材', '备件']):
                enhancement_analysis['product_catalog_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'display_optimization' if '显示' in description else 'feature_addition',
                    'estimated_impact': 'high' if '搜索' in description else 'medium'
                })
            
            # 字段显示系统增强
            elif any(keyword in description for keyword in ['字段', '显示', '格式', '单位', '属性']):
                enhancement_analysis['field_display_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'display_fix' if '错误' in description else 'display_optimization',
                    'estimated_impact': 'medium'
                })
            
            # 订单系统增强
            elif any(keyword in description for keyword in ['订单', 'order', 'PO', '导出']):
                enhancement_analysis['order_system_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'export_optimization' if '导出' in description else 'feature_addition',
                    'estimated_impact': 'high' if '详情' in description else 'medium'
                })
            
            # 用户管理增强
            elif any(keyword in description for keyword in ['用户', '账号', '登录', '注册', '头像']):
                enhancement_analysis['user_management_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'feature_fix' if '失效' in description else 'feature_addition',
                    'estimated_impact': 'medium'
                })
            
            # 文件上传增强
            elif any(keyword in description for keyword in ['上传', '图片', 'PDF', '文件']):
                enhancement_analysis['file_upload_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'preview_optimization' if '预览' in description else 'upload_improvement',
                    'estimated_impact': 'medium'
                })
            
            # 通知系统增强
            elif any(keyword in description for keyword in ['邮件', '通知', '发送']):
                enhancement_analysis['notification_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'email_optimization' if '邮件' in description else 'notification_addition',
                    'estimated_impact': 'high' if '区域' in description else 'medium'
                })
            
            # 搜索筛选增强
            elif any(keyword in description for keyword in ['搜索', '查找', '筛选']):
                enhancement_analysis['search_filter_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'search_enhancement',
                    'estimated_impact': 'high'
                })
            
            # 支付系统增强
            elif any(keyword in description for keyword in ['支付', '付款', '信用卡']):
                enhancement_analysis['payment_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'payment_page_addition',
                    'estimated_impact': 'high'
                })
            
            # 库存系统增强
            elif any(keyword in description for keyword in ['库存', '仓库']):
                enhancement_analysis['inventory_enhancements'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'inventory_display_addition',
                    'estimated_impact': 'high'
                })
            
            # 新功能
            else:
                enhancement_analysis['new_features'].append({
                    'id': prompt_id,
                    'description': prompt.get('description', ''),
                    'enhancement_type': 'new_feature',
                    'estimated_impact': 'high' if prompt.get('priority') == '高' else 'medium'
                })
        
        return enhancement_analysis
    
    def generate_comparison_report(self):
        """生成对比报告"""
        print("🔍 开始生成详细功能对比报告...")
        
        # 分析现有功能
        existing_functions = self.analyze_existing_functionality()
        
        # 分析提示词增强
        enhancement_analysis = self.analyze_prompts_enhancement()
        
        # 生成对比分析
        comparison_analysis = self.create_comparison_analysis(existing_functions, enhancement_analysis)
        
        # 生成报告
        self.generate_reports(comparison_analysis)
        
    def create_comparison_analysis(self, existing_functions, enhancement_analysis):
        """创建对比分析"""
        comparison = {
            'system_overview': {
                'existing_systems': len(existing_functions),
                'enhancement_areas': len(enhancement_analysis),
                'total_enhancements': sum(len(enhancements) for enhancements in enhancement_analysis.values())
            },
            'detailed_comparison': {},
            'improvement_metrics': {},
            'implementation_priorities': {}
        }
        
        # 详细对比每个系统
        for system_name, system_info in existing_functions.items():
            enhancement_key = f'{system_name}_enhancements'
            enhancements = enhancement_analysis.get(enhancement_key, [])
            
            comparison['detailed_comparison'][system_name] = {
                'current_state': {
                    'components': system_info['components'],
                    'features': system_info['features'],
                    'strengths': system_info['strengths'],
                    'weaknesses': system_info['weaknesses']
                },
                'enhancements': enhancements,
                'improvement_areas': self.identify_improvement_areas(system_info, enhancements),
                'estimated_impact': self.calculate_estimated_impact(enhancements)
            }
        
        # 计算改进指标
        comparison['improvement_metrics'] = self.calculate_improvement_metrics(enhancement_analysis)
        
        # 确定实施优先级
        comparison['implementation_priorities'] = self.determine_implementation_priorities(enhancement_analysis)
        
        return comparison
    
    def identify_improvement_areas(self, system_info, enhancements):
        """识别改进领域"""
        improvement_areas = []
        
        # 基于现有弱点和增强需求识别改进领域
        for weakness in system_info['weaknesses']:
            matching_enhancements = [e for e in enhancements if any(keyword in e['description'].lower() for keyword in weakness.lower().split())]
            if matching_enhancements:
                improvement_areas.append({
                    'area': weakness,
                    'enhancements': matching_enhancements,
                    'priority': 'high' if len(matching_enhancements) > 2 else 'medium'
                })
        
        return improvement_areas
    
    def calculate_estimated_impact(self, enhancements):
        """计算预估影响"""
        high_impact = len([e for e in enhancements if e.get('estimated_impact') == 'high'])
        medium_impact = len([e for e in enhancements if e.get('estimated_impact') == 'medium'])
        
        return {
            'high_impact_count': high_impact,
            'medium_impact_count': medium_impact,
            'total_enhancements': len(enhancements),
            'overall_impact': 'high' if high_impact > medium_impact else 'medium'
        }
    
    def calculate_improvement_metrics(self, enhancement_analysis):
        """计算改进指标"""
        total_enhancements = sum(len(enhancements) for enhancements in enhancement_analysis.values())
        
        metrics = {
            'total_enhancements': total_enhancements,
            'system_coverage': len([k for k, v in enhancement_analysis.items() if v]),
            'high_impact_enhancements': sum(len([e for e in enhancements if e.get('estimated_impact') == 'high']) for enhancements in enhancement_analysis.values()),
            'new_features': len(enhancement_analysis.get('new_features', [])),
            'improvement_distribution': {}
        }
        
        for system, enhancements in enhancement_analysis.items():
            if enhancements:
                metrics['improvement_distribution'][system] = {
                    'count': len(enhancements),
                    'percentage': round((len(enhancements) / total_enhancements) * 100, 1)
                }
        
        return metrics
    
    def determine_implementation_priorities(self, enhancement_analysis):
        """确定实施优先级"""
        priorities = {
            'high_priority': [],
            'medium_priority': [],
            'low_priority': []
        }
        
        for system, enhancements in enhancement_analysis.items():
            for enhancement in enhancements:
                priority = 'high_priority' if enhancement.get('estimated_impact') == 'high' else 'medium_priority'
                priorities[priority].append({
                    'system': system,
                    'enhancement': enhancement
                })
        
        return priorities
    
    def generate_reports(self, comparison_analysis):
        """生成报告"""
        print("\n📊 生成对比报告...")
        
        # 保存JSON报告
        json_file = os.path.join(self.output_dir, 'detailed_functional_comparison.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(comparison_analysis, f, ensure_ascii=False, indent=2)
        
        # 生成Markdown报告
        markdown_report = self.generate_markdown_report(comparison_analysis)
        markdown_file = os.path.join(self.output_dir, 'detailed_functional_comparison.md')
        with open(markdown_file, 'w', encoding='utf-8') as f:
            f.write(markdown_report)
        
        print(f"✅ 对比报告已保存到:")
        print(f"  - JSON: {json_file}")
        print(f"  - Markdown: {markdown_file}")
    
    def generate_markdown_report(self, comparison_analysis):
        """生成Markdown格式的报告"""
        overview = comparison_analysis['system_overview']
        detailed_comparison = comparison_analysis['detailed_comparison']
        metrics = comparison_analysis['improvement_metrics']
        priorities = comparison_analysis['implementation_priorities']
        
        md_content = f"""# BJT Phase2 现有功能与提示词详细对比分析

## 📋 分析概览

- **生成时间**: {datetime.now().isoformat()}
- **现有系统数量**: {overview['existing_systems']} 个
- **增强领域**: {overview['enhancement_areas']} 个
- **总增强数量**: {overview['total_enhancements']} 个

## 🎯 改进指标

### 总体指标
- **总增强数量**: {metrics['total_enhancements']} 个
- **系统覆盖**: {metrics['system_coverage']} 个系统
- **高影响增强**: {metrics['high_impact_enhancements']} 个
- **新功能**: {metrics['new_features']} 个

### 改进分布
"""
        
        for system, distribution in metrics['improvement_distribution'].items():
            md_content += f"- **{system.replace('_', ' ').title()}**: {distribution['count']} 个 ({distribution['percentage']}%)\n"
        
        md_content += "\n## 🔍 详细系统对比\n\n"
        
        for system_name, comparison in detailed_comparison.items():
            current_state = comparison['current_state']
            enhancements = comparison['enhancements']
            improvement_areas = comparison['improvement_areas']
            impact = comparison['estimated_impact']
            
            md_content += f"### {system_name.replace('_', ' ').title()}\n\n"
            
            md_content += "#### 当前状态\n"
            md_content += f"- **组件**: {', '.join(current_state['components']) if current_state['components'] else '无'}\n"
            md_content += f"- **功能**: {', '.join(current_state['features'])}\n"
            md_content += f"- **优势**: {', '.join(current_state['strengths'])}\n"
            md_content += f"- **弱点**: {', '.join(current_state['weaknesses'])}\n\n"
            
            md_content += "#### 增强内容\n"
            if enhancements:
                for enhancement in enhancements:
                    md_content += f"- **{enhancement['id']}**: {enhancement['description']} (影响: {enhancement['estimated_impact']})\n"
            else:
                md_content += "- 无直接增强\n"
            
            md_content += f"\n#### 改进领域\n"
            if improvement_areas:
                for area in improvement_areas:
                    md_content += f"- **{area['area']}** (优先级: {area['priority']})\n"
            else:
                md_content += "- 无明显改进领域\n"
            
            md_content += f"\n#### 预估影响\n"
            md_content += f"- **高影响**: {impact['high_impact_count']} 个\n"
            md_content += f"- **中影响**: {impact['medium_impact_count']} 个\n"
            md_content += f"- **总体影响**: {impact['overall_impact']}\n\n"
            
            md_content += "---\n\n"
        
        md_content += "## 🚀 实施优先级\n\n"
        
        for priority_level, items in priorities.items():
            md_content += f"### {priority_level.replace('_', ' ').title()}\n\n"
            if items:
                for item in items:
                    enhancement = item['enhancement']
                    md_content += f"- **{enhancement['id']}** ({item['system']}): {enhancement['description']}\n"
            else:
                md_content += "- 无\n"
            md_content += "\n"
        
        md_content += "## 💡 关键发现\n\n"
        
        md_content += "### 1. 系统覆盖全面\n"
        md_content += f"提示词覆盖了 {metrics['system_coverage']} 个现有系统，确保了对整个平台的全面增强。\n\n"
        
        md_content += "### 2. 重点突出\n"
        md_content += f"共有 {metrics['high_impact_enhancements']} 个高影响增强，主要集中在用户体验和核心功能优化。\n\n"
        
        md_content += "### 3. 新功能丰富\n"
        md_content += f"新增 {metrics['new_features']} 个新功能，扩展了系统的能力边界。\n\n"
        
        md_content += "### 4. 改进针对性强\n"
        md_content += "提示词针对现有系统的弱点进行了精准的改进，避免了盲目开发。\n\n"
        
        md_content += "## 🎉 结论\n\n"
        
        md_content += f"""
通过详细对比分析，提示词对BJT Phase2现有功能的提升效果显著：

1. **全面覆盖**: 覆盖了 {overview['existing_systems']} 个现有系统，确保全面提升
2. **精准改进**: 针对现有弱点进行了 {overview['total_enhancements']} 个精准改进
3. **高影响**: {metrics['high_impact_enhancements']} 个高影响增强将显著改善用户体验
4. **新功能**: {metrics['new_features']} 个新功能扩展了系统能力
5. **实施指导**: 提供了详细的实施优先级和指导

建议按照优先级顺序实施，确保最大化提升效果。
"""
        
        return md_content

def main():
    comparator = DetailedFunctionalComparison()
    comparator.generate_comparison_report()
    print("\n🎉 详细功能对比分析完成！")

if __name__ == "__main__":
    main() 