// Test API configuration from frontend
const fetch = require('node-fetch');

async function testApiEndpoints() {
    const baseUrl = 'http://localhost:8080/wp-json/bjt/v1';
    
    const endpoints = [
        '/product-lines',
        '/consumables',
        '/accessories',
        '/accessory-models',
        '/machines'
    ];
    
    console.log('Testing API endpoints from', baseUrl);
    console.log('='.repeat(50));
    
    for (const endpoint of endpoints) {
        try {
            const url = baseUrl + endpoint;
            console.log(`Testing: ${url}`);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            
            console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                if (data.data && Array.isArray(data.data)) {
                    console.log(`   Items count: ${data.data.length}`);
                } else if (data.data && data.data.items) {
                    console.log(`   Items count: ${data.data.items.length}`);
                } else {
                    console.log(`   Response format: ${typeof data.data}`);
                }
            }
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
        console.log('');
    }
}

testApiEndpoints(); 