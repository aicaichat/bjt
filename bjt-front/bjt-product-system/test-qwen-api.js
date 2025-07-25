const fetch = require('node-fetch');

async function testQwenAPI() {
  const apiKey = 'sk-d82da97c918e4d8aa4bf41c13f6a7ba7';
  const baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  
  console.log('🔍 测试 Qwen API 连接...');
  console.log('API Key:', apiKey.substring(0, 10) + '...');
  console.log('Base URL:', baseUrl);
  
  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'qwen3-coder-plus',
        messages: [
          {
            role: 'user',
            content: 'Hello, please respond with "API test successful"'
          }
        ],
        max_tokens: 100
      })
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API 测试成功!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API 测试失败!');
      console.log('Error Response:', errorText);
    }
  } catch (error) {
    console.log('❌ 网络错误:', error.message);
  }
}

// 测试不同的 API 端点
async function testAlternativeEndpoints() {
  const apiKey = 'sk-d82da97c918e4d8aa4bf41c13f6a7ba7';
  const endpoints = [
    'https://dashscope.aliyuncs.com/compatible-mode/v1',
    'https://dashscope.aliyuncs.com/api/v1',
    'https://dashscope.aliyuncs.com/v1'
  ];
  
  for (const baseUrl of endpoints) {
    console.log(`\n🔍 测试端点: ${baseUrl}`);
    try {
      const response = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      console.log('Status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ 端点可用!');
        console.log('Models:', data);
        break;
      } else {
        const errorText = await response.text();
        console.log('❌ 端点不可用:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ 网络错误:', error.message);
    }
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始 Qwen API 测试...\n');
  
  await testQwenAPI();
  await testAlternativeEndpoints();
  
  console.log('\n📋 测试完成!');
  console.log('\n💡 如果 API Key 无效，请：');
  console.log('1. 访问 https://bailian.console.aliyun.com/');
  console.log('2. 申请有效的 API Key');
  console.log('3. 更新 .env 文件中的 OPENAI_API_KEY');
}

runTests().catch(console.error); 