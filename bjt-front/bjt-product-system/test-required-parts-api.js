// 测试必选备件API的脚本
// 在浏览器控制台中运行

async function testRequiredPartsAPI() {
  console.log('🧪 [testRequiredPartsAPI] Starting API test...');
  
  try {
    // 测试FR8002配件的必选备件
    const partNumber = '60A11002'; // FR8002的料号
    const url = `/wp-json/bjt/v1/accessories?part_number=${partNumber}`;
    
    console.log('🔍 [testRequiredPartsAPI] Fetching:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    
    console.log('📡 [testRequiredPartsAPI] Response status:', response.status);
    console.log('📡 [testRequiredPartsAPI] Response headers:', response.headers);
    
    if (!response.ok) {
      console.error('❌ [testRequiredPartsAPI] API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📦 [testRequiredPartsAPI] Full response data:', data);
    
    if (data.items && data.items.length > 0) {
      const accessory = data.items[0];
      console.log('🔍 [testRequiredPartsAPI] First accessory:', accessory);
      console.log('🔍 [testRequiredPartsAPI] Required parts:', accessory.required_parts);
      
      if (accessory.required_parts && accessory.required_parts.length > 0) {
        console.log('✅ [testRequiredPartsAPI] Found required parts!');
        accessory.required_parts.forEach((part, index) => {
          console.log(`  ${index + 1}. ${part.part_number} (数量: ${part.quantity})`);
        });
      } else {
        console.log('📝 [testRequiredPartsAPI] No required parts found');
      }
    } else {
      console.log('📝 [testRequiredPartsAPI] No accessories found');
    }
    
  } catch (error) {
    console.error('❌ [testRequiredPartsAPI] Error:', error);
  }
}

// 运行测试
testRequiredPartsAPI(); 