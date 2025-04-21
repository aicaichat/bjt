// 模拟数据
const mockData = {
    products: [
        { 
            id: 1, 
            model: "BLP-001", 
            title: "智能控制器", 
            description: "高性能智能控制器，支持多种协议",
            title_zh: "智能控制器",
            description_zh: "高性能智能控制器，支持多种协议",
            title_en: "Smart Controller",
            description_en: "High-performance smart controller with multi-protocol support",
            image: "https://via.placeholder.com/150" 
        },
        { 
            id: 2, 
            model: "BLP-002", 
            title: "数据采集器", 
            description: "工业级数据采集器，稳定可靠",
            title_zh: "数据采集器",
            description_zh: "工业级数据采集器，稳定可靠",
            title_en: "Data Collector",
            description_en: "Industrial-grade data collector, stable and reliable",
            image: "https://via.placeholder.com/150" 
        },
        { 
            id: 3, 
            model: "BLP-003", 
            title: "通信模块", 
            description: "低功耗通信模块，支持远距离传输",
            title_zh: "通信模块",
            description_zh: "低功耗通信模块，支持远距离传输",
            title_en: "Communication Module",
            description_en: "Low-power communication module with long-range transmission",
            image: "https://via.placeholder.com/150" 
        }
    ],
    // 连接到WordPress REST API的配置
    apiSettings: {
        // 默认为模拟数据模式
        useMockData: true,
        // WordPress REST API端点
        restUrl: '/wp-json/bjt-product/v1',
        // 如果需要使用实际API，设置useMockData为false并添加以下必要信息
        nonce: '', // 从WordPress获取的安全nonce
        
        // 实际API调用函数
        fetchProducts: async function() {
            if (this.useMockData) {
                return mockData.products;
            }
            
            try {
                const response = await fetch(`${this.restUrl}/products`, {
                    headers: {
                        'X-WP-Nonce': this.nonce
                    }
                });
                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
            } catch (error) {
                console.error('Error fetching products:', error);
                return mockData.products; // 失败时使用模拟数据
            }
        },
        
        saveProduct: async function(product) {
            if (this.useMockData) {
                // 模拟保存逻辑
                if (product.id) {
                    // 更新
                    const index = mockData.products.findIndex(p => p.id === product.id);
                    if (index !== -1) mockData.products[index] = product;
                } else {
                    // 新增
                    product.id = Math.max(...mockData.products.map(p => p.id)) + 1;
                    mockData.products.push(product);
                }
                return product;
            }
            
            try {
                const method = product.id ? 'PUT' : 'POST';
                const url = product.id ? 
                    `${this.restUrl}/products/${product.id}` : 
                    `${this.restUrl}/products`;
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-WP-Nonce': this.nonce
                    },
                    body: JSON.stringify(product)
                });
                
                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
            } catch (error) {
                console.error('Error saving product:', error);
                // 返回模拟的成功结果
                return product;
            }
        }
    }
}; 