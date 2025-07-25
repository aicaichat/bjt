#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为二期需求生成代码提示词
为每个需求编写清晰的开发指导，避免重复编写代码和影响现有代码
"""

import json
import os
from datetime import datetime
from typing import Dict, List, Any

class CodingPromptsGenerator:
    def __init__(self):
        self.output_dir = 'output/coding-prompts'
        self.prompts = []
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
    def generate_prompts(self):
        """生成所有需求的代码提示词"""
        detailed_file = 'output/detailed-requirements-analysis/detailed_requirements_analysis.json'
        
        print("🔧 开始生成代码提示词...")
        
        # 读取详细分析数据
        with open(detailed_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 为每个需求生成提示词
        for req in data['requirements']:
            prompt = self.generate_single_prompt(req)
            self.prompts.append(prompt)
        
        print(f"✅ 成功生成 {len(self.prompts)} 个代码提示词")
        
        # 生成提示词文件
        self.generate_prompt_files()
        
    def generate_single_prompt(self, requirement):
        """为单个需求生成代码提示词"""
        prompt = {
            'id': requirement['id'],
            'description': requirement['description'],
            'category': requirement['category'],
            'priority': requirement['priority'],
            'type': requirement['type'],  # 添加缺失的type字段
            'estimated_days': requirement['estimated_days'],
            'frontend_days': requirement['frontend_days'],
            'backend_days': requirement['backend_days'],
            'database_days': requirement['database_days'],
            'testing_days': requirement['testing_days'],
            'coding_prompt': self.create_coding_prompt(requirement),
            'implementation_notes': self.create_implementation_notes(requirement),
            'code_structure': self.suggest_code_structure(requirement),
            'testing_guidelines': self.create_testing_guidelines(requirement)
        }
        
        return prompt
    
    def create_coding_prompt(self, requirement):
        """创建代码提示词"""
        description = requirement['description'].lower()
        req_type = requirement['type']
        complexity = requirement['complexity']
        
        prompt = f"""# {requirement['id']} - {requirement['description']}

## 需求描述
{requirement['description']}

## 开发目标
"""
        
        # 根据需求类型和描述生成具体的开发目标
        if '字段' in description or '显示' in description:
            prompt += self.generate_field_display_prompt(requirement)
        elif '页面' in description or '界面' in description:
            prompt += self.generate_page_interface_prompt(requirement)
        elif '功能' in description or '流程' in description:
            prompt += self.generate_function_flow_prompt(requirement)
        elif 'API' in description or '接口' in description:
            prompt += self.generate_api_interface_prompt(requirement)
        elif '数据库' in description or '表' in description:
            prompt += self.generate_database_prompt(requirement)
        elif '购物车' in description or '订单' in description:
            prompt += self.generate_cart_order_prompt(requirement)
        elif '用户' in description or '权限' in description:
            prompt += self.generate_user_permission_prompt(requirement)
        elif '搜索' in description:
            prompt += self.generate_search_prompt(requirement)
        elif '邮件' in description:
            prompt += self.generate_email_prompt(requirement)
        elif '支付' in description:
            prompt += self.generate_payment_prompt(requirement)
        elif '图片' in description or '上传' in description:
            prompt += self.generate_image_upload_prompt(requirement)
        else:
            prompt += self.generate_general_prompt(requirement)
        
        return prompt
    
    def generate_field_display_prompt(self, requirement):
        """生成字段显示相关的提示词"""
        return f"""
1. 修改前端显示逻辑，确保字段正确显示
2. 检查后端数据返回格式
3. 更新相关组件的props和state
4. 添加必要的验证和错误处理

## 代码修改要点
- 查找现有的字段显示组件
- 修改字段映射逻辑
- 更新样式和布局
- 确保数据一致性

## 注意事项
- 不要删除现有字段，只修改显示逻辑
- 保持向后兼容性
- 测试不同数据状态下的显示效果
"""
    
    def generate_page_interface_prompt(self, requirement):
        """生成页面界面相关的提示词"""
        return f"""
1. 创建或修改页面组件
2. 实现页面布局和样式
3. 添加必要的交互功能
4. 集成数据获取和提交逻辑

## 代码修改要点
- 使用现有的页面模板和组件库
- 遵循项目的设计规范
- 实现响应式布局
- 添加加载状态和错误处理

## 注意事项
- 复用现有的UI组件
- 保持页面风格一致性
- 确保移动端适配
- 添加适当的动画效果
"""
    
    def generate_function_flow_prompt(self, requirement):
        """生成功能流程相关的提示词"""
        return f"""
1. 分析现有功能流程
2. 设计新的流程逻辑
3. 实现流程控制组件
4. 添加流程状态管理

## 代码修改要点
- 使用状态管理工具（Redux/Context）
- 实现流程步骤控制
- 添加数据验证和错误处理
- 实现流程回退和重试机制

## 注意事项
- 保持现有流程的稳定性
- 添加流程进度指示
- 实现数据持久化
- 提供用户友好的错误提示
"""
    
    def generate_api_interface_prompt(self, requirement):
        """生成API接口相关的提示词"""
        return f"""
1. 设计API接口规范
2. 实现后端API端点
3. 创建前端API调用函数
4. 添加接口文档和测试

## 代码修改要点
- 遵循RESTful API设计原则
- 实现适当的认证和授权
- 添加请求参数验证
- 实现错误处理和日志记录

## 注意事项
- 使用现有的API架构模式
- 保持接口版本兼容性
- 添加接口限流和缓存
- 实现完整的错误码体系
"""
    
    def generate_database_prompt(self, requirement):
        """生成数据库相关的提示词"""
        return f"""
1. 设计数据库表结构
2. 创建数据库迁移脚本
3. 实现数据访问层
4. 添加数据验证和约束

## 代码修改要点
- 使用现有的数据库连接池
- 实现事务管理
- 添加索引优化
- 实现数据备份策略

## 注意事项
- 遵循数据库命名规范
- 保持数据一致性
- 实现软删除机制
- 添加数据审计日志
"""
    
    def generate_cart_order_prompt(self, requirement):
        """生成购物车订单相关的提示词"""
        return f"""
1. 修改购物车组件逻辑
2. 更新订单处理流程
3. 实现订单状态管理
4. 添加订单验证规则

## 代码修改要点
- 使用现有的购物车状态管理
- 实现订单数据持久化
- 添加库存检查逻辑
- 实现订单确认流程

## 注意事项
- 保持购物车数据同步
- 实现订单并发控制
- 添加订单超时处理
- 实现订单取消机制
"""
    
    def generate_user_permission_prompt(self, requirement):
        """生成用户权限相关的提示词"""
        return f"""
1. 实现用户认证逻辑
2. 添加权限控制组件
3. 实现角色管理功能
4. 添加权限验证中间件

## 代码修改要点
- 使用现有的认证系统
- 实现细粒度权限控制
- 添加权限缓存机制
- 实现权限审计日志

## 注意事项
- 保持现有用户数据安全
- 实现权限继承机制
- 添加权限变更通知
- 实现权限回滚机制
"""
    
    def generate_search_prompt(self, requirement):
        """生成搜索相关的提示词"""
        return f"""
1. 实现搜索算法逻辑
2. 创建搜索组件界面
3. 添加搜索过滤功能
4. 实现搜索结果排序

## 代码修改要点
- 使用现有的搜索库或API
- 实现搜索建议功能
- 添加搜索历史记录
- 实现搜索高亮显示

## 注意事项
- 优化搜索性能
- 实现搜索防抖
- 添加搜索无结果提示
- 实现搜索分页功能
"""
    
    def generate_email_prompt(self, requirement):
        """生成邮件相关的提示词"""
        return f"""
1. 配置邮件服务设置
2. 实现邮件模板系统
3. 创建邮件发送队列
4. 添加邮件发送状态跟踪

## 代码修改要点
- 使用现有的邮件服务配置
- 实现邮件模板变量替换
- 添加邮件发送重试机制
- 实现邮件发送日志记录

## 注意事项
- 确保邮件服务稳定性
- 实现邮件发送限流
- 添加邮件内容验证
- 实现邮件退订机制
"""
    
    def generate_payment_prompt(self, requirement):
        """生成支付相关的提示词"""
        return f"""
1. 集成第三方支付API
2. 实现支付流程控制
3. 创建支付状态管理
4. 添加支付安全验证

## 代码修改要点
- 使用现有的支付网关配置
- 实现支付回调处理
- 添加支付金额验证
- 实现支付超时处理

## 注意事项
- 确保支付数据安全
- 实现支付状态同步
- 添加支付失败处理
- 实现支付退款机制
"""
    
    def generate_image_upload_prompt(self, requirement):
        """生成图片上传相关的提示词"""
        return f"""
1. 实现文件上传组件
2. 配置文件存储服务
3. 添加文件类型验证
4. 实现图片压缩和优化

## 代码修改要点
- 使用现有的文件上传组件
- 实现拖拽上传功能
- 添加文件大小限制
- 实现图片预览功能

## 注意事项
- 确保文件上传安全
- 实现文件存储优化
- 添加文件删除机制
- 实现文件访问权限控制
"""
    
    def generate_general_prompt(self, requirement):
        """生成通用提示词"""
        return f"""
1. 分析现有代码结构
2. 设计功能实现方案
3. 实现核心功能逻辑
4. 添加必要的测试

## 代码修改要点
- 遵循项目代码规范
- 使用现有的工具和库
- 实现错误处理机制
- 添加必要的注释

## 注意事项
- 保持代码可维护性
- 避免重复造轮子
- 确保功能稳定性
- 添加适当的日志记录
"""
    
    def create_implementation_notes(self, requirement):
        """创建实施说明"""
        description = requirement['description'].lower()
        
        notes = []
        
        # 根据需求类型添加特定说明
        if requirement['type'] == 'bug_fix':
            notes.append("这是一个Bug修复，需要先复现问题，然后定位根本原因")
            notes.append("修复后需要进行回归测试，确保不影响其他功能")
        
        if requirement['type'] == 'new_feature':
            notes.append("这是新功能开发，需要设计新的组件和逻辑")
            notes.append("确保新功能与现有系统良好集成")
        
        if requirement['type'] == 'optimization':
            notes.append("这是功能优化，需要分析现有性能瓶颈")
            notes.append("优化后需要对比性能提升效果")
        
        # 根据复杂度添加说明
        if requirement['complexity'] == 'high':
            notes.append("复杂度较高，建议分步骤实施")
            notes.append("需要充分测试，确保稳定性")
        
        # 根据风险等级添加说明
        if requirement['risk_level'] == 'high':
            notes.append("风险较高，需要制定应急预案")
            notes.append("建议先在测试环境验证")
        
        # 根据依赖关系添加说明
        if requirement['dependencies']:
            notes.append(f"依赖系统: {', '.join(requirement['dependencies'])}")
            notes.append("需要确保依赖系统正常工作")
        
        return notes
    
    def suggest_code_structure(self, requirement):
        """建议代码结构"""
        description = requirement['description'].lower()
        
        structure = {
            'frontend_files': [],
            'backend_files': [],
            'database_files': [],
            'test_files': []
        }
        
        # 根据需求类型和描述建议文件结构
        if '字段' in description or '显示' in description:
            structure['frontend_files'] = [
                'components/FieldDisplay.tsx',
                'utils/fieldUtils.ts',
                'types/fieldTypes.ts'
            ]
            structure['test_files'] = [
                '__tests__/components/FieldDisplay.test.tsx'
            ]
        
        elif '页面' in description or '界面' in description:
            structure['frontend_files'] = [
                'pages/NewPage.tsx',
                'components/PageLayout.tsx',
                'hooks/usePageData.ts'
            ]
            structure['test_files'] = [
                '__tests__/pages/NewPage.test.tsx'
            ]
        
        elif 'API' in description or '接口' in description:
            structure['backend_files'] = [
                'controllers/NewController.php',
                'services/NewService.php',
                'models/NewModel.php'
            ]
            structure['frontend_files'] = [
                'api/newApi.ts',
                'hooks/useNewApi.ts'
            ]
            structure['test_files'] = [
                '__tests__/api/newApi.test.ts'
            ]
        
        elif '数据库' in description or '表' in description:
            structure['database_files'] = [
                'migrations/create_new_table.sql',
                'models/NewModel.php'
            ]
            structure['backend_files'] = [
                'repositories/NewRepository.php'
            ]
        
        return structure
    
    def create_testing_guidelines(self, requirement):
        """创建测试指导"""
        description = requirement['description'].lower()
        
        guidelines = []
        
        # 基础测试要求
        guidelines.append("单元测试：测试核心功能逻辑")
        guidelines.append("集成测试：测试组件间交互")
        guidelines.append("端到端测试：测试完整用户流程")
        
        # 根据需求类型添加特定测试
        if requirement['type'] == 'bug_fix':
            guidelines.append("回归测试：确保修复不引入新问题")
            guidelines.append("边界测试：测试各种边界条件")
        
        if requirement['type'] == 'new_feature':
            guidelines.append("功能测试：验证新功能正常工作")
            guidelines.append("兼容性测试：确保与现有功能兼容")
        
        if requirement['type'] == 'optimization':
            guidelines.append("性能测试：对比优化前后性能")
            guidelines.append("压力测试：验证优化效果")
        
        # 根据复杂度添加测试
        if requirement['complexity'] == 'high':
            guidelines.append("全面测试：覆盖所有可能的场景")
            guidelines.append("安全测试：验证安全性要求")
        
        # 根据风险等级添加测试
        if requirement['risk_level'] == 'high':
            guidelines.append("风险测试：重点测试高风险场景")
            guidelines.append("故障恢复测试：验证故障恢复能力")
        
        return guidelines
    
    def generate_prompt_files(self):
        """生成提示词文件"""
        print("\n📝 生成提示词文件...")
        
        # 生成总体提示词文件
        self.generate_overall_prompt_file()
        
        # 生成分类提示词文件
        self.generate_categorized_prompt_files()
        
        # 生成单个需求提示词文件
        self.generate_individual_prompt_files()
        
        print("✅ 提示词文件生成完成")
    
    def generate_overall_prompt_file(self):
        """生成总体提示词文件"""
        content = f"""# 二期需求开发提示词总览

## 📋 项目信息
- 总需求数: {len(self.prompts)} 个
- 生成时间: {datetime.now().isoformat()}

## 🎯 开发原则
1. **代码复用**: 优先使用现有组件和工具，避免重复编写
2. **渐进式开发**: 小步快跑，逐步完善功能
3. **向后兼容**: 确保新功能不影响现有系统
4. **测试驱动**: 编写充分的测试用例
5. **文档完善**: 及时更新代码注释和文档

## 🔧 技术栈
- 前端: React + TypeScript
- 后端: PHP + WordPress
- 数据库: MySQL
- 测试: Jest + React Testing Library

## 📁 文件结构规范
```
frontend/src/
├── components/     # 可复用组件
├── pages/         # 页面组件
├── hooks/         # 自定义Hooks
├── utils/         # 工具函数
├── types/         # TypeScript类型定义
├── api/           # API调用函数
└── __tests__/     # 测试文件

backend/
├── controllers/   # 控制器
├── services/      # 业务逻辑
├── models/        # 数据模型
├── repositories/  # 数据访问层
└── migrations/    # 数据库迁移
```

## 🚀 开发流程
1. 阅读需求描述和开发目标
2. 分析现有代码结构
3. 设计实现方案
4. 编写代码和测试
5. 代码审查和优化
6. 部署和验证

## ⚠️ 注意事项
- 遵循项目代码规范
- 使用现有的设计模式和组件库
- 确保代码质量和可维护性
- 及时提交代码和更新文档
"""
        
        # 添加所有需求的简要列表
        content += "\n## 📝 需求列表\n\n"
        for prompt in self.prompts:
            content += f"### {prompt['id']}\n"
            content += f"- **描述**: {prompt['description']}\n"
            content += f"- **工作量**: {prompt['estimated_days']} 天\n"
            content += f"- **优先级**: {prompt['priority']}\n"
            content += f"- **类型**: {prompt['type']}\n\n"
        
        # 保存文件
        overall_file = os.path.join(self.output_dir, 'overall_coding_prompts.md')
        with open(overall_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ 总体提示词文件已保存: {overall_file}")
    
    def generate_categorized_prompt_files(self):
        """生成分类提示词文件"""
        # 按类型分类
        categories = {}
        for prompt in self.prompts:
            category = prompt['category'] if prompt['category'] else '未分类'
            if category not in categories:
                categories[category] = []
            categories[category].append(prompt)
        
        # 生成每个分类的文件
        for category, prompts in categories.items():
            content = f"# {category} - 开发提示词\n\n"
            
            for prompt in prompts:
                content += f"## {prompt['id']} - {prompt['description']}\n\n"
                content += f"**工作量**: {prompt['estimated_days']} 天\n"
                content += f"**优先级**: {prompt['priority']}\n\n"
                content += "### 开发目标\n"
                content += prompt['coding_prompt'].split('## 开发目标')[1].split('##')[0]
                content += "\n### 实施说明\n"
                for note in prompt['implementation_notes']:
                    content += f"- {note}\n"
                content += "\n---\n\n"
            
            # 保存文件
            category_file = os.path.join(self.output_dir, f'{category}_prompts.md')
            with open(category_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ 分类提示词文件已保存: {category_file}")
    
    def generate_individual_prompt_files(self):
        """生成单个需求提示词文件"""
        for prompt in self.prompts:
            content = prompt['coding_prompt']
            content += "\n\n## 实施说明\n"
            for note in prompt['implementation_notes']:
                content += f"- {note}\n"
            
            content += "\n## 建议代码结构\n"
            structure = prompt['code_structure']
            if structure['frontend_files']:
                content += "\n### 前端文件\n"
                for file in structure['frontend_files']:
                    content += f"- `{file}`\n"
            
            if structure['backend_files']:
                content += "\n### 后端文件\n"
                for file in structure['backend_files']:
                    content += f"- `{file}`\n"
            
            if structure['database_files']:
                content += "\n### 数据库文件\n"
                for file in structure['database_files']:
                    content += f"- `{file}`\n"
            
            if structure['test_files']:
                content += "\n### 测试文件\n"
                for file in structure['test_files']:
                    content += f"- `{file}`\n"
            
            content += "\n## 测试指导\n"
            for guideline in prompt['testing_guidelines']:
                content += f"- {guideline}\n"
            
            # 保存文件
            individual_file = os.path.join(self.output_dir, f'{prompt["id"]}_prompt.md')
            with open(individual_file, 'w', encoding='utf-8') as f:
                f.write(content)
        
        print(f"✅ 单个需求提示词文件已保存: {len(self.prompts)} 个文件")
    
    def generate_json_summary(self):
        """生成JSON格式的总结"""
        summary = {
            'generated_at': datetime.now().isoformat(),
            'total_prompts': len(self.prompts),
            'prompts': self.prompts
        }
        
        # 保存JSON文件
        json_file = os.path.join(self.output_dir, 'coding_prompts_summary.json')
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        print(f"✅ JSON总结文件已保存: {json_file}")

def main():
    generator = CodingPromptsGenerator()
    generator.generate_prompts()
    generator.generate_json_summary()
    print("\n🎉 代码提示词生成完成！")

if __name__ == "__main__":
    main() 