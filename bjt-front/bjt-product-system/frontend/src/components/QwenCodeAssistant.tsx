import React, { useState } from 'react';
import { Button, Input, Select, message, Card, Space, Typography, Divider } from 'antd';
import { CodeOutlined, BugOutlined, FileTextOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useQwenCode, CodeGenerationRequest } from '../utils/qwen-code-integration';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface QwenCodeAssistantProps {
  config?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  };
}

export const QwenCodeAssistant: React.FC<QwenCodeAssistantProps> = ({ config }) => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState('typescript');
  const [action, setAction] = useState<'generate' | 'review' | 'refactor' | 'test'>('generate');
  const [prompt, setPrompt] = useState('');

  const { generateCode, reviewCode, refactorCode, generateTests } = useQwenCode(config);

  const handleAction = async () => {
    if (!inputCode.trim() && action !== 'generate') {
      message.error('请先输入代码');
      return;
    }

    if (action === 'generate' && !prompt.trim()) {
      message.error('请输入代码生成提示');
      return;
    }

    setLoading(true);
    try {
      let result: string;

      switch (action) {
        case 'generate':
          const request: CodeGenerationRequest = {
            prompt: prompt,
            language: language,
            context: '这是一个 React TypeScript 项目'
          };
          const response = await generateCode(request);
          result = response.code;
          setExplanation(response.explanation || '');
          break;

        case 'review':
          result = await reviewCode(inputCode, language);
          setExplanation(result);
          result = inputCode; // 保持原代码显示
          break;

        case 'refactor':
          result = await refactorCode(inputCode, language);
          setExplanation('代码已重构，请查看下方的重构结果');
          break;

        case 'test':
          result = await generateTests(inputCode, language);
          setExplanation('测试代码已生成，请查看下方的测试代码');
          break;

        default:
          result = '';
      }

      setOutputCode(result);
      message.success('操作完成');
    } catch (error) {
      console.error('Qwen Code 操作失败:', error);
      message.error('操作失败，请检查配置和网络连接');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setInputCode('');
    setOutputCode('');
    setExplanation('');
    setPrompt('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>
          <CodeOutlined /> Qwen Code 助手
        </Title>
        <Text type="secondary">
          基于 Qwen3-Coder 的智能代码生成和编辑工具
        </Text>

        <Divider />

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 操作选择 */}
          <div>
            <Text strong>选择操作：</Text>
            <Select
              value={action}
              onChange={setAction}
              style={{ width: 200, marginLeft: 16 }}
            >
              <Option value="generate">
                <ThunderboltOutlined /> 生成代码
              </Option>
              <Option value="review">
                <FileTextOutlined /> 代码审查
              </Option>
              <Option value="refactor">
                <CodeOutlined /> 代码重构
              </Option>
              <Option value="test">
                <BugOutlined /> 生成测试
              </Option>
            </Select>

            <Select
              value={language}
              onChange={setLanguage}
              style={{ width: 150, marginLeft: 16 }}
            >
              <Option value="typescript">TypeScript</Option>
              <Option value="javascript">JavaScript</Option>
              <Option value="python">Python</Option>
              <Option value="java">Java</Option>
              <Option value="cpp">C++</Option>
              <Option value="go">Go</Option>
              <Option value="rust">Rust</Option>
            </Select>
          </div>

          {/* 输入区域 */}
          {action === 'generate' ? (
            <div>
              <Text strong>代码生成提示：</Text>
              <TextArea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="请描述您想要生成的代码功能..."
                rows={4}
                style={{ marginTop: 8 }}
              />
            </div>
          ) : (
            <div>
              <Text strong>输入代码：</Text>
              <TextArea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="请粘贴需要处理的代码..."
                rows={8}
                style={{ marginTop: 8 }}
              />
            </div>
          )}

          {/* 操作按钮 */}
          <div>
            <Button
              type="primary"
              onClick={handleAction}
              loading={loading}
              icon={<CodeOutlined />}
              size="large"
            >
              {action === 'generate' && '生成代码'}
              {action === 'review' && '审查代码'}
              {action === 'refactor' && '重构代码'}
              {action === 'test' && '生成测试'}
            </Button>

            <Button
              onClick={clearAll}
              style={{ marginLeft: 16 }}
              size="large"
            >
              清空所有
            </Button>
          </div>

          {/* 输出区域 */}
          {(outputCode || explanation) && (
            <div>
              {outputCode && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong>输出代码：</Text>
                    <Button
                      size="small"
                      onClick={() => copyToClipboard(outputCode)}
                    >
                      复制代码
                    </Button>
                  </div>
                  <TextArea
                    value={outputCode}
                    readOnly
                    rows={12}
                    style={{ fontFamily: 'monospace' }}
                  />
                </div>
              )}

              {explanation && (
                <div>
                  <Text strong>说明：</Text>
                  <div
                    style={{
                      padding: 12,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 6,
                      marginTop: 8,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {explanation}
                  </div>
                </div>
              )}
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default QwenCodeAssistant; 