const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing spare parts API...');
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/spare-parts?page=1&per_page=5&lang=zh&status=publish');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data structure:', {
        hasSuccess: 'success' in data,
        successValue: data.success,
        hasData: 'data' in data,
        dataType: typeof data.data,
        dataIsArray: Array.isArray(data.data),
        dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
        allKeys: Object.keys(data || {}),
        firstItem: Array.isArray(data.data) && data.data.length > 0 ? data.data[0] : null
      });
      
      if (Array.isArray(data.data) && data.data.length > 0) {
        console.log('First spare part fields:', Object.keys(data.data[0]));
        console.log('First spare part sample:', {
          id: data.data[0].id,
          part_number: data.data[0].part_number,
          name_zh: data.data[0].name_zh,
          name_en: data.data[0].name_en,
          spec: data.data[0].spec,
          app_sn: data.data[0].app_sn,
          package_size_cm: data.data[0].package_size_cm
        });
      }
    } else {
      console.log('API request failed:', response.statusText);
    }
  } catch (error) {
    console.error('API test failed:', error.message);
  }
}

testAPI(); 