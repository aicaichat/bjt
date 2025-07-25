/**
 * Qwen Code 前端集成工具
 * 提供与 Qwen3-Coder 模型的交互功能
 */

export interface QwenCodeConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CodeGenerationRequest {
  prompt: string;
  language?: string;
  context?: string;
  filePath?: string;
}

export interface CodeGenerationResponse {
  code: string;
  explanation?: string;
  suggestions?: string[];
}

export class QwenCodeIntegration {
  private config: QwenCodeConfig;

  constructor(config: QwenCodeConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 4000,
      ...config
    };
  }

  /**
   * 生成代码
   */
  async generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的代码生成助手，专门使用 ${request.language || 'JavaScript/TypeScript'} 语言。
              请根据用户的需求生成高质量的代码，并提供清晰的解释。`
            },
            {
              role: 'user',
              content: this.buildPrompt(request)
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return this.parseCodeResponse(content);
    } catch (error) {
      console.error('Qwen Code 生成失败:', error);
      throw error;
    }
  }

  /**
   * 代码审查
   */
  async reviewCode(code: string, language: string = 'typescript'): Promise<string> {
    const request: CodeGenerationRequest = {
      prompt: `请审查以下 ${language} 代码，提供改进建议和最佳实践：\n\n${code}`,
      language
    };

    const response = await this.generateCode(request);
    return response.explanation || '代码审查完成';
  }

  /**
   * 代码重构
   */
  async refactorCode(code: string, language: string = 'typescript'): Promise<string> {
    const request: CodeGenerationRequest = {
      prompt: `请重构以下 ${language} 代码，提高可读性、性能和可维护性：\n\n${code}`,
      language
    };

    const response = await this.generateCode(request);
    return response.code;
  }

  /**
   * 生成测试代码
   */
  async generateTests(code: string, language: string = 'typescript'): Promise<string> {
    const request: CodeGenerationRequest = {
      prompt: `请为以下 ${language} 代码生成完整的单元测试：\n\n${code}`,
      language
    };

    const response = await this.generateCode(request);
    return response.code;
  }

  /**
   * 构建提示词
   */
  private buildPrompt(request: CodeGenerationRequest): string {
    let prompt = request.prompt;

    if (request.context) {
      prompt = `上下文信息：${request.context}\n\n${prompt}`;
    }

    if (request.filePath) {
      prompt = `文件路径：${request.filePath}\n\n${prompt}`;
    }

    if (request.language) {
      prompt = `${prompt}\n\n请使用 ${request.language} 语言编写代码。`;
    }

    return prompt;
  }

  /**
   * 解析代码响应
   */
  private parseCodeResponse(content: string): CodeGenerationResponse {
    // 尝试提取代码块
    const codeBlockRegex = /```(?:[\w-]+)?\n([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[1].trim());
    }

    // 提取解释部分（代码块之前的内容）
    const explanation = content.split('```')[0].trim();

    return {
      code: codeBlocks.join('\n\n'),
      explanation: explanation || undefined,
      suggestions: this.extractSuggestions(content)
    };
  }

  /**
   * 提取建议
   */
  private extractSuggestions(content: string): string[] {
    const suggestions: string[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        suggestions.push(line.trim().substring(2));
      }
    }

    return suggestions;
  }
}

/**
 * 默认配置
 */
export const defaultQwenConfig: QwenCodeConfig = {
  apiKey: process.env.REACT_APP_OPENAI_API_KEY || '',
  baseUrl: process.env.REACT_APP_OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  model: process.env.REACT_APP_OPENAI_MODEL || 'qwen3-coder-plus',
  temperature: 0.7,
  maxTokens: 4000
};

/**
 * 创建 Qwen Code 实例
 */
export function createQwenCodeIntegration(config?: Partial<QwenCodeConfig>): QwenCodeIntegration {
  const finalConfig = { ...defaultQwenConfig, ...config };
  return new QwenCodeIntegration(finalConfig);
}

/**
 * React Hook 用于 Qwen Code 集成
 */
export function useQwenCode(config?: Partial<QwenCodeConfig>) {
  const qwenCode = createQwenCodeIntegration(config);

  return {
    generateCode: qwenCode.generateCode.bind(qwenCode),
    reviewCode: qwenCode.reviewCode.bind(qwenCode),
    refactorCode: qwenCode.refactorCode.bind(qwenCode),
    generateTests: qwenCode.generateTests.bind(qwenCode)
  };
} 