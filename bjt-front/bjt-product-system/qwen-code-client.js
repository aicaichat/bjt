#!/usr/bin/env node

const fetch = require('node-fetch');
const readline = require('readline');

class QwenCodeClient {
  constructor(apiKey, baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = 'qwen3-coder-plus';
  }

  async generateCode(prompt, language = 'typescript') {
    try {
      console.log('🤖 正在生成代码...');
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的代码生成助手，专门使用 ${language} 语言。
              请根据用户的需求生成高质量的代码，并提供清晰的解释。
              请使用代码块格式输出代码。`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return this.parseCodeResponse(content);
    } catch (error) {
      console.error('❌ 代码生成失败:', error.message);
      throw error;
    }
  }

  parseCodeResponse(content) {
    // 尝试提取代码块
    const codeBlockRegex = /```(?:[\w-]+)?\n([\s\S]*?)```/g;
    const codeBlocks = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[1].trim());
    }

    // 提取解释部分（代码块之前的内容）
    const explanation = content.split('```')[0].trim();

    return {
      code: codeBlocks.join('\n\n'),
      explanation: explanation || undefined,
      fullResponse: content
    };
  }

  async interactiveMode() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🚀 Qwen Code 交互模式已启动');
    console.log('输入 "quit" 或 "exit" 退出');
    console.log('输入 "help" 查看帮助');
    console.log('');

    const askQuestion = () => {
      rl.question('💬 请输入您的需求: ', async (input) => {
        if (input.toLowerCase() === 'quit' || input.toLowerCase() === 'exit') {
          console.log('👋 再见！');
          rl.close();
          return;
        }

        if (input.toLowerCase() === 'help') {
          console.log(`
📖 帮助信息:
- 代码生成: "创建一个 React 组件"
- 代码审查: "审查这段代码"
- 代码重构: "重构这个函数"
- 生成测试: "为这个组件生成测试"
- 退出: "quit" 或 "exit"
- 帮助: "help"
          `);
          askQuestion();
          return;
        }

        try {
          const result = await this.generateCode(input);
          
          console.log('\n📝 说明:');
          if (result.explanation) {
            console.log(result.explanation);
          }
          
          if (result.code) {
            console.log('\n💻 生成的代码:');
            console.log('```typescript');
            console.log(result.code);
            console.log('```');
          }
          
          console.log('\n' + '='.repeat(50) + '\n');
        } catch (error) {
          console.log('❌ 生成失败，请重试');
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

// 命令行参数处理
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    prompt: null,
    language: 'typescript',
    interactive: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (arg === '-i' || arg === '--interactive') {
      options.interactive = true;
    } else if (arg === '-l' || arg === '--language') {
      options.language = args[++i] || 'typescript';
    } else if (arg === '-p' || arg === '--prompt') {
      options.prompt = args[++i] || '';
    } else if (!options.prompt) {
      options.prompt = arg;
    }
  }

  return options;
}

// 主函数
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    console.log(`
🚀 Qwen Code 客户端

用法:
  node qwen-code-client.js [选项] [提示]

选项:
  -h, --help              显示帮助信息
  -i, --interactive       启动交互模式
  -l, --language <lang>   指定编程语言 (默认: typescript)
  -p, --prompt <text>     指定提示文本

示例:
  node qwen-code-client.js "创建一个 React 组件"
  node qwen-code-client.js -l python "创建一个计算器函数"
  node qwen-code-client.js -i

环境变量:
  QWEN_API_KEY            阿里云百炼平台 API Key
  QWEN_BASE_URL           API 基础 URL (可选)
    `);
    return;
  }

  const apiKey = process.env.QWEN_API_KEY || 'sk-d82da97c918e4d8aa4bf41c13f6a7ba7';
  const baseUrl = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  if (!apiKey) {
    console.error('❌ 请设置 QWEN_API_KEY 环境变量');
    process.exit(1);
  }

  const client = new QwenCodeClient(apiKey, baseUrl);

  if (options.interactive) {
    await client.interactiveMode();
  } else if (options.prompt) {
    try {
      const result = await client.generateCode(options.prompt, options.language);
      
      console.log('📝 说明:');
      if (result.explanation) {
        console.log(result.explanation);
      }
      
      if (result.code) {
        console.log('\n💻 生成的代码:');
        console.log('```' + options.language);
        console.log(result.code);
        console.log('```');
      }
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
      process.exit(1);
    }
  } else {
    console.error('❌ 请提供提示文本或使用 -i 启动交互模式');
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error);
}

module.exports = QwenCodeClient; 