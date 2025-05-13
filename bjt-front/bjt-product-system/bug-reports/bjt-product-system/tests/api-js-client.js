/**
 * BJT Product System API JavaScript客户端
 * 
 * 此脚本演示如何在前端JavaScript中调用BJT Product System的API
 */

class BJTApiClient {
    /**
     * 构造函数
     * @param {string} apiBaseUrl - API基础URL
     */
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.token = null;
    }

    /**
     * 设置认证令牌
     * @param {string} token - 认证令牌
     */
    setToken(token) {
        this.token = token;
    }

    /**
     * 获取认证令牌
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Promise<string>} 认证令牌
     */
    async authenticate(username, password) {
        const authUrl = this.apiBaseUrl.replace('/bjt/v1', '/jwt-auth/v1/token');
        
        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.token) {
                this.token = data.token;
                return this.token;
            } else {
                throw new Error('获取令牌失败');
            }
        } catch (error) {
            console.error('认证失败:', error);
            throw error;
        }
    }

    /**
     * 发送API请求
     * @param {string} method - HTTP方法
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据 (可选)
     * @returns {Promise<Object>} 响应数据
     */
    async request(method, endpoint, data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const options = {
            method: method,
            headers: headers
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${method} ${endpoint} - 状态码 ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /**
     * 获取所有产品线
     * @returns {Promise<Array>} 产品线列表
     */
    async getProductLines() {
        return this.request('GET', '/product-lines');
    }
    
    /**
     * 获取特定产品线
     * @param {number} id - 产品线ID
     * @returns {Promise<Object>} 产品线信息
     */
    async getProductLine(id) {
        return this.request('GET', `/product-lines/${id}`);
    }
    
    /**
     * 创建产品线
     * @param {Object} data - 产品线数据
     * @returns {Promise<Object>} 创建的产品线信息
     */
    async createProductLine(data) {
        return this.request('POST', '/product-lines', data);
    }
    
    /**
     * 更新产品线
     * @param {number} id - 产品线ID
     * @param {Object} data - 更新数据
     * @returns {Promise<Object>} 更新后的产品线信息
     */
    async updateProductLine(id, data) {
        return this.request('PUT', `/product-lines/${id}`, data);
    }
    
    /**
     * 删除产品线
     * @param {number} id - 产品线ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteProductLine(id) {
        return this.request('DELETE', `/product-lines/${id}`);
    }
    
    /**
     * 获取产品线下的主机型号
     * @param {number} id - 产品线ID
     * @returns {Promise<Array>} 主机型号列表
     */
    async getProductLineHostModels(id) {
        return this.request('GET', `/product-lines/${id}/host-models`);
    }
    
    /**
     * 获取所有主机型号
     * @returns {Promise<Array>} 主机型号列表
     */
    async getHostModels() {
        return this.request('GET', '/host-models');
    }
    
    /**
     * 获取特定主机型号
     * @param {number} id - 主机型号ID
     * @returns {Promise<Object>} 主机型号信息
     */
    async getHostModel(id) {
        return this.request('GET', `/host-models/${id}`);
    }
    
    /**
     * 创建主机型号
     * @param {Object} data - 主机型号数据
     * @returns {Promise<Object>} 创建的主机型号信息
     */
    async createHostModel(data) {
        return this.request('POST', '/host-models', data);
    }
    
    /**
     * 更新主机型号
     * @param {number} id - 主机型号ID
     * @param {Object} data - 更新数据
     * @returns {Promise<Object>} 更新后的主机型号信息
     */
    async updateHostModel(id, data) {
        return this.request('PUT', `/host-models/${id}`, data);
    }
    
    /**
     * 删除主机型号
     * @param {number} id - 主机型号ID
     * @returns {Promise<Object>} 删除结果
     */
    async deleteHostModel(id) {
        return this.request('DELETE', `/host-models/${id}`);
    }
    
    // 以下为其他API方法，根据需要补充...
}

/**
 * 使用示例 - 产品线管理页面
 */
document.addEventListener('DOMContentLoaded', async () => {
    // 创建API客户端实例
    const apiClient = new BJTApiClient('http://localhost:8080/wp-json/bjt/v1');
    
    // DOM元素
    const productLinesList = document.getElementById('product-lines-list');
    const productLineForm = document.getElementById('product-line-form');
    const messageContainer = document.getElementById('messages');
    
    // 显示消息函数
    function showMessage(message, type = 'info') {
        messageContainer.innerHTML = `<div class="message ${type}">${message}</div>`;
        setTimeout(() => {
            messageContainer.innerHTML = '';
        }, 5000);
    }
    
    // 加载所有产品线
    async function loadProductLines() {
        try {
            const productLines = await apiClient.getProductLines();
            
            // 清空列表
            productLinesList.innerHTML = '';
            
            if (productLines && productLines.length > 0) {
                // 创建产品线列表
                productLines.forEach(line => {
                    const listItem = document.createElement('div');
                    listItem.className = 'product-line-item';
                    listItem.innerHTML = `
                        <h3>${line.title_zh} (${line.title_en})</h3>
                        <p>代码: ${line.code}</p>
                        <div class="actions">
                            <button class="edit-btn" data-id="${line.id}">编辑</button>
                            <button class="delete-btn" data-id="${line.id}">删除</button>
                            <button class="host-models-btn" data-id="${line.id}">查看主机型号</button>
                        </div>
                    `;
                    productLinesList.appendChild(listItem);
                });
                
                // 添加事件监听器
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        loadProductLineForEdit(id);
                    });
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        if (confirm('确定要删除此产品线吗？')) {
                            const id = e.target.getAttribute('data-id');
                            try {
                                await apiClient.deleteProductLine(id);
                                showMessage('产品线已成功删除', 'success');
                                loadProductLines(); // 重新加载列表
                            } catch (error) {
                                showMessage('删除产品线失败: ' + error.message, 'error');
                            }
                        }
                    });
                });
                
                document.querySelectorAll('.host-models-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.getAttribute('data-id');
                        loadHostModels(id);
                    });
                });
            } else {
                productLinesList.innerHTML = '<p>没有找到产品线</p>';
            }
        } catch (error) {
            showMessage('加载产品线失败: ' + error.message, 'error');
        }
    }
    
    // 加载产品线用于编辑
    async function loadProductLineForEdit(id) {
        try {
            const productLine = await apiClient.getProductLine(id);
            
            // 填充表单
            document.getElementById('product-line-id').value = productLine.id;
            document.getElementById('title-zh').value = productLine.title_zh;
            document.getElementById('title-en').value = productLine.title_en;
            document.getElementById('code').value = productLine.code;
            document.getElementById('description-zh').value = productLine.description_zh || '';
            document.getElementById('description-en').value = productLine.description_en || '';
            document.getElementById('status').value = productLine.status;
            
            // 显示表单
            productLineForm.style.display = 'block';
            document.getElementById('form-title').textContent = '编辑产品线';
            document.getElementById('submit-btn').textContent = '更新';
        } catch (error) {
            showMessage('加载产品线详情失败: ' + error.message, 'error');
        }
    }
    
    // 加载产品线的主机型号
    async function loadHostModels(productLineId) {
        try {
            const hostModels = await apiClient.getProductLineHostModels(productLineId);
            
            // 显示主机型号列表
            const hostModelsList = document.getElementById('host-models-list');
            hostModelsList.innerHTML = '';
            
            if (hostModels && hostModels.length > 0) {
                const productLine = await apiClient.getProductLine(productLineId);
                
                hostModelsList.innerHTML = `<h2>${productLine.title_zh}的主机型号</h2>`;
                
                hostModels.forEach(model => {
                    const listItem = document.createElement('div');
                    listItem.className = 'host-model-item';
                    listItem.innerHTML = `
                        <h3>${model.model_name} (${model.name_en})</h3>
                        <p>型号: ${model.model_number}</p>
                        <p>描述: ${model.description_zh || '无'}</p>
                    `;
                    hostModelsList.appendChild(listItem);
                });
                
                document.getElementById('host-models-container').style.display = 'block';
            } else {
                hostModelsList.innerHTML = `<p>此产品线下没有主机型号</p>`;
                document.getElementById('host-models-container').style.display = 'block';
            }
        } catch (error) {
            showMessage('加载主机型号失败: ' + error.message, 'error');
        }
    }
    
    // 提交产品线表单
    productLineForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const id = document.getElementById('product-line-id').value;
        const formData = {
            title_zh: document.getElementById('title-zh').value,
            title_en: document.getElementById('title-en').value,
            code: document.getElementById('code').value,
            description_zh: document.getElementById('description-zh').value,
            description_en: document.getElementById('description-en').value,
            status: document.getElementById('status').value
        };
        
        try {
            if (id) {
                // 更新现有产品线
                await apiClient.updateProductLine(id, formData);
                showMessage('产品线已成功更新', 'success');
            } else {
                // 创建新产品线
                await apiClient.createProductLine(formData);
                showMessage('产品线已成功创建', 'success');
            }
            
            // 重置表单
            productLineForm.reset();
            document.getElementById('product-line-id').value = '';
            document.getElementById('form-title').textContent = '添加产品线';
            document.getElementById('submit-btn').textContent = '添加';
            
            // 重新加载产品线列表
            loadProductLines();
        } catch (error) {
            showMessage('保存产品线失败: ' + error.message, 'error');
        }
    });
    
    // 取消按钮
    document.getElementById('cancel-btn').addEventListener('click', () => {
        productLineForm.reset();
        document.getElementById('product-line-id').value = '';
        document.getElementById('form-title').textContent = '添加产品线';
        document.getElementById('submit-btn').textContent = '添加';
    });
    
    // 添加产品线按钮
    document.getElementById('add-product-line-btn').addEventListener('click', () => {
        productLineForm.reset();
        document.getElementById('product-line-id').value = '';
        document.getElementById('form-title').textContent = '添加产品线';
        document.getElementById('submit-btn').textContent = '添加';
        productLineForm.style.display = 'block';
    });
    
    // 关闭主机型号列表按钮
    document.getElementById('close-host-models-btn').addEventListener('click', () => {
        document.getElementById('host-models-container').style.display = 'none';
    });
    
    // 初始加载产品线
    loadProductLines();
}); 