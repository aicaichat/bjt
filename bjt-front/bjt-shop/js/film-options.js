/**
 * Film Options Page - 4.html复制版本
 * 处理电影选项页面的功能、数据加载、筛选和购物车管理
 */

// 页面状态管理
const state = {
  selectedMachine: null,
  films: [],
  filteredFilms: [],
  currentPage: 1,
  itemsPerPage: 12,
  recentlyViewed: [],
  recommendedBundles: [],
  filters: {
    thickness: 'all',
    width: 'all',
    length: 'all',
    shapes: [],
    materials: [],
    priceRange: {min: 0, max: 500},
    stock: 'all',
    sort: 'default'
  },
  userType: 'standard' // 默认值，将在初始化时更新
};

// 页面初始化
function init() {
  // 加载用户信息
  loadUserInfo();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 加载选中的机器
  loadSelectedMachine();
  
  // 更新价格范围显示
  updatePriceRangeLabels();
  
  // 从URL加载筛选条件
  loadFiltersFromUrl();
  
  // 更新购物车显示
  updateCartDisplay();
}

// 加载用户信息
function loadUserInfo() {
  // 从localStorage获取用户信息
  const userJson = localStorage.getItem('bjt_user');
  if (userJson) {
    const user = JSON.parse(userJson);
    state.userType = user.type || 'standard';
    
    // 根据用户类型更新UI
    if (state.userType === 'distributor' || state.userType === 'admin') {
      document.querySelectorAll('.distributor-only').forEach(el => {
        el.style.display = 'block';
      });
    }
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 筛选相关事件
  document.getElementById('thickness-filter').addEventListener('change', updateFilters);
  document.getElementById('width-filter').addEventListener('change', updateFilters);
  document.getElementById('length-filter').addEventListener('change', updateFilters);
  document.getElementById('stock-filter').addEventListener('change', updateFilters);
  document.getElementById('sort-filter').addEventListener('change', updateFilters);
  
  // 形状筛选事件
  document.querySelectorAll('.shape-option').forEach(option => {
    option.addEventListener('click', toggleShapeFilter);
  });
  
  // 材料筛选事件
  document.querySelectorAll('input[name="material"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateFilters);
  });
  
  // 价格范围滑块事件
  document.getElementById('min-price').addEventListener('input', updatePriceRangeLabels);
  document.getElementById('max-price').addEventListener('input', updatePriceRangeLabels);
  document.getElementById('min-price').addEventListener('change', updateFilters);
  document.getElementById('max-price').addEventListener('change', updateFilters);
  
  // 筛选按钮
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('reset-no-results').addEventListener('click', resetFilters);
  
  // 购物车相关事件
  document.getElementById('cart-button').addEventListener('click', toggleCart);
  document.getElementById('close-cart').addEventListener('click', toggleCart);
  document.getElementById('clear-cart').addEventListener('click', showClearCartConfirmation);
  document.getElementById('cancel-clear').addEventListener('click', hideClearCartConfirmation);
  document.getElementById('confirm-clear').addEventListener('click', clearCart);
  document.getElementById('checkout').addEventListener('click', proceedToCheckout);
}

// 加载选中的机器
function loadSelectedMachine() {
  const machineId = localStorage.getItem('selectedMachineId');
  if (!machineId) {
    showError('未选择机器', '请先选择一台机器');
    document.getElementById('selected-machine').innerHTML = `
      <div class="alert alert-warning">
        未选择机器。请 <a href="product-config.html">选择一台机器</a> 以继续。
      </div>
    `;
    return;
  }
  
  // 显示加载状态
  showLoading('machine');
  
  // 从本地JSON文件加载数据
  fetch('data/products.json')
    .then(response => response.json())
    .then(data => {
      // 查找选中的机器
      const machine = data.machines.find(m => m.id === machineId);
      if (!machine) {
        throw new Error('找不到选中的机器');
      }
      
      state.selectedMachine = machine;
      
      // 渲染机器信息
      renderSelectedMachine(machine);
      
      // 加载兼容的膜材
      loadCompatibleFilms(data, machine);
      
      // 加载推荐组合
      loadRecommendedBundles(data, machine);
      
      // 加载最近查看
      loadRecentlyViewed(data);
      
      // 隐藏加载状态
      hideLoading('machine');
    })
    .catch(error => {
      console.error('加载机器数据出错:', error);
      hideLoading('machine');
      showError('加载错误', '无法加载机器数据');
    });
}

// 渲染选中的机器
function renderSelectedMachine(machine) {
  const machineElement = document.getElementById('selected-machine');
  
  // 确保机器数据存在
  if (!machine) {
    machineElement.innerHTML = '<div class="alert alert-warning">未找到机器数据</div>';
    return;
  }
  
  // 创建机器展示HTML
  machineElement.innerHTML = `
    <div class="selected-product">
      <div class="product-image-container">
        <img src="${machine.image}" alt="${machine.name}" class="product-image">
      </div>
      <div class="product-details">
        <h3 class="product-name">${machine.name}</h3>
        <p class="product-description">${machine.shortDescription}</p>
        <div class="product-meta">
          <span class="meta-item"><strong>型号:</strong> ${machine.id}</span>
          ${machine.specifications ? Object.entries(machine.specifications).slice(0, 2).map(([key, value]) => 
            `<span class="meta-item"><strong>${formatSpecName(key)}:</strong> ${value}</span>`
          ).join('') : ''}
        </div>
        <div class="product-price-container">
          <span class="product-price">${formatPrice(machine.price)}</span>
          ${machine.originalPrice ? `<span class="product-original-price">${formatPrice(machine.originalPrice)}</span>` : ''}
        </div>
        <button id="change-machine-btn" class="btn btn-outline-primary">
          <i class="fas fa-exchange-alt"></i> 更换机器
        </button>
      </div>
    </div>
  `;
  
  // 添加更换机器按钮事件
  document.getElementById('change-machine-btn').addEventListener('click', () => {
    window.location.href = 'product-config.html';
  });
}

// 加载兼容的膜材
function loadCompatibleFilms(data, machine) {
  // 显示加载状态
  showLoading('films');
  
  // 检查机器是否有兼容膜材列表
  if (!machine.compatibleFilms || machine.compatibleFilms.length === 0) {
    document.getElementById('film-list').innerHTML = `
      <div class="alert alert-info">该机器没有兼容的膜材</div>
    `;
    hideLoading('films');
    return;
  }
  
  // 获取所有消耗品
  const allConsumables = data.consumables || [];
  
  // 过滤出兼容的膜材
  state.films = allConsumables.filter(film => {
    // 检查是否兼容当前机器
    return film.compatibleModels && 
           (film.compatibleModels.includes(machine.id) || film.compatibleModels.includes('all'));
  });
  
  if (state.films.length === 0) {
    document.getElementById('film-list').innerHTML = `
      <div class="alert alert-info">未找到兼容的膜材</div>
    `;
    hideLoading('films');
    return;
  }
  
  // 填充筛选选项
  populateFilterOptions();
  
  // 应用筛选并渲染膜材
  applyFilters();
  
  // 隐藏加载状态
  hideLoading('films');
}

// 填充筛选选项下拉菜单
function populateFilterOptions() {
  // 获取厚度、宽度和长度的唯一值
  const thicknesses = [...new Set(state.films.map(film => film.specifications?.thickness || '未知'))].sort();
  const widths = [...new Set(state.films.map(film => film.specifications?.width || '未知'))].sort();
  const lengths = [...new Set(state.films.map(film => film.specifications?.length || '未知'))].sort();
  
  // 填充厚度筛选器
  const thicknessFilter = document.getElementById('thickness-filter');
  thicknessFilter.innerHTML = '<option value="all">所有厚度</option>';
  thicknesses.forEach(thickness => {
    const option = document.createElement('option');
    option.value = thickness;
    option.textContent = thickness;
    thicknessFilter.appendChild(option);
  });
  
  // 填充宽度筛选器
  const widthFilter = document.getElementById('width-filter');
  widthFilter.innerHTML = '<option value="all">所有宽度</option>';
  widths.forEach(width => {
    const option = document.createElement('option');
    option.value = width;
    option.textContent = width;
    widthFilter.appendChild(option);
  });
  
  // 填充长度筛选器
  const lengthFilter = document.getElementById('length-filter');
  lengthFilter.innerHTML = '<option value="all">所有长度</option>';
  lengths.forEach(length => {
    const option = document.createElement('option');
    option.value = length;
    option.textContent = length;
    lengthFilter.appendChild(option);
  });
  
  // 初始化价格范围
  if (state.films.length > 0) {
    const prices = state.films.map(film => film.price);
    const minPrice = Math.floor(Math.min(...prices));
    const maxPrice = Math.ceil(Math.max(...prices));
    
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    
    minPriceInput.min = minPrice;
    minPriceInput.max = maxPrice;
    minPriceInput.value = minPrice;
    
    maxPriceInput.min = minPrice;
    maxPriceInput.max = maxPrice;
    maxPriceInput.value = maxPrice;
    
    state.filters.priceRange.min = minPrice;
    state.filters.priceRange.max = maxPrice;
    
    updatePriceRangeLabels();
  }
}

// 更新价格范围标签
function updatePriceRangeLabels() {
  const minPriceInput = document.getElementById('min-price');
  const maxPriceInput = document.getElementById('max-price');
  const minPriceLabel = document.getElementById('min-price-label');
  const maxPriceLabel = document.getElementById('max-price-label');
  
  minPriceLabel.textContent = formatPrice(minPriceInput.value);
  maxPriceLabel.textContent = formatPrice(maxPriceInput.value);
}

// 更新筛选条件
function updateFilters() {
  // 获取筛选器值
  const thicknessFilter = document.getElementById('thickness-filter').value;
  const widthFilter = document.getElementById('width-filter').value;
  const lengthFilter = document.getElementById('length-filter').value;
  const stockFilter = document.getElementById('stock-filter').value;
  const sortFilter = document.getElementById('sort-filter').value;
  
  // 获取价格范围
  const minPrice = parseFloat(document.getElementById('min-price').value);
  const maxPrice = parseFloat(document.getElementById('max-price').value);
  
  // 获取选中的材料类型
  const selectedMaterials = [];
  document.querySelectorAll('input[name="material"]:checked').forEach(checkbox => {
    selectedMaterials.push(checkbox.value);
  });
  
  // 更新状态
  state.filters = {
    ...state.filters,
    thickness: thicknessFilter,
    width: widthFilter,
    length: lengthFilter,
    materials: selectedMaterials,
    priceRange: { min: minPrice, max: maxPrice },
    stock: stockFilter,
    sort: sortFilter
  };
}

// 切换形状筛选器的选中状态
function toggleShapeFilter(event) {
  const shapeOption = event.currentTarget;
  const shape = shapeOption.dataset.shape;
  
  // 切换选中状态
  shapeOption.classList.toggle('selected');
  
  // 更新选中的形状列表
  if (shapeOption.classList.contains('selected')) {
    if (!state.filters.shapes.includes(shape)) {
      state.filters.shapes.push(shape);
    }
  } else {
    state.filters.shapes = state.filters.shapes.filter(s => s !== shape);
  }
  
  // 更新筛选
  updateFilters();
}

// 应用筛选条件
function applyFilters() {
  // 首先确保筛选器状态是最新的
  updateFilters();
  
  // 重置到第一页
  state.currentPage = 1;
  
  // 筛选膜材
  filterFilms();
  
  // 更新URL参数以反映当前筛选条件
  updateUrlWithFilters();
  
  // 渲染结果
  renderFilms();
  
  // 更新分页
  updatePagination();
}

// 根据筛选条件过滤膜材
function filterFilms() {
  // 创建初始筛选结果副本
  state.filteredFilms = [...state.films];
  
  // 应用厚度筛选
  if (state.filters.thickness !== 'all') {
    state.filteredFilms = state.filteredFilms.filter(film => 
      film.specifications?.thickness === state.filters.thickness
    );
  }
  
  // 应用宽度筛选
  if (state.filters.width !== 'all') {
    state.filteredFilms = state.filteredFilms.filter(film => 
      film.specifications?.width === state.filters.width
    );
  }
  
  // 应用长度筛选
  if (state.filters.length !== 'all') {
    state.filteredFilms = state.filteredFilms.filter(film => 
      film.specifications?.length === state.filters.length
    );
  }
  
  // 应用形状筛选
  if (state.filters.shapes.length > 0) {
    state.filteredFilms = state.filteredFilms.filter(film => 
      state.filters.shapes.includes(film.shape || 'square')
    );
  }
  
  // 应用材料筛选
  if (state.filters.materials.length > 0) {
    state.filteredFilms = state.filteredFilms.filter(film => 
      state.filters.materials.includes(film.material || 'standard')
    );
  }
  
  // 应用价格范围筛选
  state.filteredFilms = state.filteredFilms.filter(film => 
    film.price >= state.filters.priceRange.min && 
    film.price <= state.filters.priceRange.max
  );
  
  // 应用库存状态筛选
  if (state.filters.stock === 'in-stock') {
    state.filteredFilms = state.filteredFilms.filter(film => 
      film.inventory > 0
    );
  } else if (state.filters.stock === 'out-of-stock') {
    state.filteredFilms = state.filteredFilms.filter(film => 
      film.inventory === 0
    );
  }
  
  // 应用排序
  sortFilms();
}

// 根据排序条件对膜材进行排序
function sortFilms() {
  switch (state.filters.sort) {
    case 'price-asc':
      state.filteredFilms.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      state.filteredFilms.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      state.filteredFilms.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      state.filteredFilms.sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      // 默认排序：按ID排序
      state.filteredFilms.sort((a, b) => a.id.localeCompare(b.id));
  }
}

// 更新URL中的筛选参数
function updateUrlWithFilters() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  
  // 清除现有参数
  params.delete('thickness');
  params.delete('width');
  params.delete('length');
  params.delete('shape');
  params.delete('material');
  params.delete('minPrice');
  params.delete('maxPrice');
  params.delete('stock');
  params.delete('sort');
  params.delete('page');
  
  // 添加新参数
  if (state.filters.thickness !== 'all') params.set('thickness', state.filters.thickness);
  if (state.filters.width !== 'all') params.set('width', state.filters.width);
  if (state.filters.length !== 'all') params.set('length', state.filters.length);
  
  state.filters.shapes.forEach(shape => {
    params.append('shape', shape);
  });
  
  state.filters.materials.forEach(material => {
    params.append('material', material);
  });
  
  params.set('minPrice', state.filters.priceRange.min);
  params.set('maxPrice', state.filters.priceRange.max);
  
  if (state.filters.stock !== 'all') params.set('stock', state.filters.stock);
  if (state.filters.sort !== 'default') params.set('sort', state.filters.sort);
  
  if (state.currentPage > 1) params.set('page', state.currentPage);
  
  // 更新浏览器历史记录
  window.history.replaceState({}, '', url.toString());
}

// 渲染结果
function renderFilms() {
  const filmListElement = document.getElementById('film-list');
  const noResultsElement = document.getElementById('no-results');
  const resultsCountElement = document.getElementById('results-count');
  
  // 清空现有内容
  filmListElement.innerHTML = '';
  
  // 应用分页
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const pagedFilms = state.filteredFilms.slice(startIndex, endIndex);
  
  // 更新结果计数
  resultsCountElement.textContent = state.filteredFilms.length;
  
  // 检查是否有结果
  if (state.filteredFilms.length === 0) {
    filmListElement.style.display = 'none';
    noResultsElement.style.display = 'flex';
    return;
  } else {
    filmListElement.style.display = 'grid';
    noResultsElement.style.display = 'none';
  }
  
  // 使用模板渲染每个膜材
  const template = document.getElementById('film-item-template');
  
  pagedFilms.forEach(film => {
    const filmElement = template.content.cloneNode(true);
    
    // 设置膜材数据
    const nameElement = filmElement.querySelector('.product-name');
    const imageElement = filmElement.querySelector('.product-image');
    const descriptionElement = filmElement.querySelector('.product-description');
    const codeElement = filmElement.querySelector('.product-code');
    const dimensionsElement = filmElement.querySelector('.product-dimensions');
    const priceElement = filmElement.querySelector('.product-price');
    const originalPriceElement = filmElement.querySelector('.product-original-price');
    const inventoryElement = filmElement.querySelector('.inventory-status');
    const viewDetailsBtn = filmElement.querySelector('.view-details-btn');
    const specDownloadBtn = filmElement.querySelector('.spec-download-btn');
    const quantityInput = filmElement.querySelector('.quantity-input');
    const decreaseBtn = filmElement.querySelector('.decrease-btn');
    const increaseBtn = filmElement.querySelector('.increase-btn');
    const addToCartBtn = filmElement.querySelector('.add-to-cart-btn');
    
    // 填充数据
    nameElement.textContent = film.name;
    imageElement.src = film.image || 'images/placeholder.jpg';
    imageElement.alt = film.name;
    descriptionElement.textContent = film.shortDescription;
    codeElement.textContent = `型号: ${film.id}`;
    
    // 构建尺寸文本
    const thickness = film.specifications?.thickness || '';
    const width = film.specifications?.width || '';
    const length = film.specifications?.length || '';
    dimensionsElement.textContent = `尺寸: ${thickness} × ${width} × ${length}`;
    
    // 设置价格
    priceElement.textContent = formatPrice(film.price);
    if (film.originalPrice && film.originalPrice > film.price) {
      originalPriceElement.textContent = formatPrice(film.originalPrice);
      originalPriceElement.style.display = 'inline-block';
    } else {
      originalPriceElement.style.display = 'none';
    }
    
    // 设置库存状态
    if (film.inventory !== undefined) {
      if (film.inventory > 0) {
        inventoryElement.textContent = '有库存';
        inventoryElement.className = 'inventory-status in-stock';
        addToCartBtn.disabled = false;
        quantityInput.max = film.inventory;
      } else {
        inventoryElement.textContent = '无库存';
        inventoryElement.className = 'inventory-status out-of-stock';
        addToCartBtn.disabled = true;
      }
    } else {
      inventoryElement.style.display = 'none';
    }
    
    // 设置膜材ID
    filmElement.querySelector('.product-item').dataset.id = film.id;
    
    // 添加事件监听器
    viewDetailsBtn.addEventListener('click', () => openProductDetails(film.id));
    specDownloadBtn.addEventListener('click', () => downloadSpecSheet(film.id));
    decreaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
      }
    });
    increaseBtn.addEventListener('click', () => {
      const currentValue = parseInt(quantityInput.value);
      const max = parseInt(quantityInput.max) || 99;
      if (currentValue < max) {
        quantityInput.value = currentValue + 1;
      }
    });
    addToCartBtn.addEventListener('click', () => {
      const quantity = parseInt(quantityInput.value);
      addToCart(film.id, quantity);
    });
    
    // 添加到列表
    filmListElement.appendChild(filmElement);
  });
}

// 更新分页
function updatePagination() {
  const paginationElement = document.getElementById('pagination');
  paginationElement.innerHTML = '';
  
  if (state.filteredFilms.length === 0) {
    paginationElement.style.display = 'none';
    return;
  }
  
  const totalPages = Math.ceil(state.filteredFilms.length / state.itemsPerPage);
  
  if (totalPages <= 1) {
    paginationElement.style.display = 'none';
    return;
  }
  
  paginationElement.style.display = 'flex';
  
  // 添加"上一页"按钮
  const prevButton = document.createElement('button');
  prevButton.className = 'pagination-btn prev-btn';
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = state.currentPage === 1;
  prevButton.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderFilms();
      updatePagination();
      window.scrollTo(0, document.getElementById('film-list').offsetTop - 100);
    }
  });
  paginationElement.appendChild(prevButton);
  
  // 添加页码按钮
  const maxVisiblePages = 5;
  let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  // 添加第一页和省略号
  if (startPage > 1) {
    const firstPageBtn = document.createElement('button');
    firstPageBtn.className = 'pagination-btn page-number';
    firstPageBtn.textContent = '1';
    firstPageBtn.addEventListener('click', () => {
      state.currentPage = 1;
      renderFilms();
      updatePagination();
      window.scrollTo(0, document.getElementById('film-list').offsetTop - 100);
    });
    paginationElement.appendChild(firstPageBtn);
    
    if (startPage > 2) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      paginationElement.appendChild(ellipsis);
    }
  }
  
  // 添加页码
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.className = `pagination-btn page-number ${i === state.currentPage ? 'active' : ''}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener('click', () => {
      state.currentPage = i;
      renderFilms();
      updatePagination();
      window.scrollTo(0, document.getElementById('film-list').offsetTop - 100);
    });
    paginationElement.appendChild(pageBtn);
  }
  
  // 添加最后一页和省略号
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement('span');
      ellipsis.className = 'pagination-ellipsis';
      ellipsis.textContent = '...';
      paginationElement.appendChild(ellipsis);
    }
    
    const lastPageBtn = document.createElement('button');
    lastPageBtn.className = 'pagination-btn page-number';
    lastPageBtn.textContent = totalPages;
    lastPageBtn.addEventListener('click', () => {
      state.currentPage = totalPages;
      renderFilms();
      updatePagination();
      window.scrollTo(0, document.getElementById('film-list').offsetTop - 100);
    });
    paginationElement.appendChild(lastPageBtn);
  }
  
  // 添加"下一页"按钮
  const nextButton = document.createElement('button');
  nextButton.className = 'pagination-btn next-btn';
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = state.currentPage === totalPages;
  nextButton.addEventListener('click', () => {
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderFilms();
      updatePagination();
      window.scrollTo(0, document.getElementById('film-list').offsetTop - 100);
    }
  });
  paginationElement.appendChild(nextButton);
}

// 加载推荐组合
function loadRecommendedBundles(data, machine) {
  const bundlesContainer = document.getElementById('recommended-bundles');
  
  // 如果没有数据，隐藏整个区域
  if (!data.bundles || data.bundles.length === 0) {
    document.querySelector('.recommended-bundles-section').style.display = 'none';
    return;
  }
  
  // 过滤出与当前机器相关的组合
  const compatibleBundles = data.bundles.filter(bundle => 
    bundle.machineId === machine.id || 
    bundle.compatibleMachines.includes(machine.id) ||
    bundle.compatibleMachines.includes('all')
  );
  
  if (compatibleBundles.length === 0) {
    document.querySelector('.recommended-bundles-section').style.display = 'none';
    return;
  }
  
  document.querySelector('.recommended-bundles-section').style.display = 'block';
  bundlesContainer.innerHTML = '';
  
  // 使用模板渲染每个组合
  const template = document.getElementById('bundle-template');
  
  compatibleBundles.forEach(bundle => {
    const bundleElement = template.content.cloneNode(true);
    
    // 设置组合数据
    bundleElement.querySelector('.bundle-title').textContent = bundle.name;
    
    // 计算节省金额
    const regularPrice = bundle.items.reduce((total, item) => {
      const product = findProductById(data, item.id);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
    
    const discountPrice = bundle.price;
    const savings = regularPrice - discountPrice;
    const savingsPercent = Math.round((savings / regularPrice) * 100);
    
    if (savings > 0) {
      bundleElement.querySelector('.bundle-savings').textContent = `节省 ${formatPrice(savings)} (${savingsPercent}%)`;
    }
    
    // 渲染产品列表
    const productsContainer = bundleElement.querySelector('.bundle-products');
    
    bundle.items.forEach(item => {
      const product = findProductById(data, item.id);
      if (!product) return;
      
      const productItem = document.createElement('div');
      productItem.className = 'bundle-product';
      productItem.innerHTML = `
        <div class="product-image">
          <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}">
        </div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-quantity">x${item.quantity}</div>
        </div>
        <div class="product-price">${formatPrice(product.price)}</div>
      `;
      
      productsContainer.appendChild(productItem);
    });
    
    // 设置价格
    bundleElement.querySelector('.bundle-price').textContent = formatPrice(discountPrice);
    bundleElement.querySelector('.bundle-original-price').textContent = formatPrice(regularPrice);
    
    // 添加点击事件
    bundleElement.querySelector('.add-bundle-btn').addEventListener('click', () => {
      addBundleToCart(bundle);
    });
    
    // 添加到容器
    bundlesContainer.appendChild(bundleElement);
  });
}

// 在数据中查找产品 - 辅助函数
function findProductById(data, id) {
  let product = data.machines.find(item => item.id === id);
  if (!product) product = data.consumables.find(item => item.id === id);
  if (!product) product = data.spareParts.find(item => item.id === id);
  return product;
}

// 加载最近查看产品
function loadRecentlyViewed(data) {
  const recentlyViewedContainer = document.getElementById('recently-viewed');
  
  // 从localStorage获取最近查看的产品
  let recentlyViewed = JSON.parse(localStorage.getItem('bjt_recently_viewed') || '[]');
  
  // 如果没有最近查看的产品，隐藏整个区域
  if (recentlyViewed.length === 0) {
    document.querySelector('.recently-viewed-section').style.display = 'none';
    return;
  }
  
  // 显示区域
  document.querySelector('.recently-viewed-section').style.display = 'block';
  recentlyViewedContainer.innerHTML = '';
  
  // 找到对应的产品数据
  const products = recentlyViewed.map(id => findProductById(data, id)).filter(Boolean);
  
  if (products.length === 0) {
    document.querySelector('.recently-viewed-section').style.display = 'none';
    return;
  }
  
  // 最多显示4个产品
  products.slice(0, 4).forEach(product => {
    const productElement = document.createElement('div');
    productElement.className = 'product-item-small';
    productElement.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image || 'images/placeholder.jpg'}" alt="${product.name}" class="product-image">
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <div class="product-price-container">
          <span class="product-price">${formatPrice(product.price)}</span>
        </div>
        <button class="btn btn-sm btn-outline-primary view-product-btn" data-id="${product.id}">
          查看详情
        </button>
      </div>
    `;
    
    // 添加点击事件
    productElement.querySelector('.view-product-btn').addEventListener('click', () => {
      if (product.category === 'machine') {
        window.location.href = `product-details.html?id=${product.id}`;
      } else {
        openProductDetails(product.id);
      }
    });
    
    recentlyViewedContainer.appendChild(productElement);
  });
}

// 将产品添加到最近查看列表
function addToRecentlyViewed(productId) {
  // 获取现有数据
  let recentlyViewed = JSON.parse(localStorage.getItem('bjt_recently_viewed') || '[]');
  
  // 如果已在列表中，先移除它
  recentlyViewed = recentlyViewed.filter(id => id !== productId);
  
  // 添加到列表前面
  recentlyViewed.unshift(productId);
  
  // 保留最近的10个
  recentlyViewed = recentlyViewed.slice(0, 10);
  
  // 存储到localStorage
  localStorage.setItem('bjt_recently_viewed', JSON.stringify(recentlyViewed));
}

// 打开产品详情模态框
function openProductDetails(productId) {
  const product = state.films.find(film => film.id === productId);
  if (!product) return;
  
  // 将产品添加到最近查看
  addToRecentlyViewed(productId);
  
  // 填充模态框数据
  document.getElementById('modal-product-name').textContent = product.name;
  document.getElementById('modal-product-image').src = product.image || 'images/placeholder.jpg';
  document.getElementById('modal-product-description').textContent = product.description || product.shortDescription;
  
  // 规格
  const specsContainer = document.getElementById('modal-product-specs');
  specsContainer.innerHTML = '';
  
  if (product.specifications) {
    const specsList = document.createElement('ul');
    specsList.className = 'specs-list';
    
    Object.entries(product.specifications).forEach(([key, value]) => {
      const specItem = document.createElement('li');
      specItem.innerHTML = `<strong>${formatSpecName(key)}:</strong> ${value}`;
      specsList.appendChild(specItem);
    });
    
    specsContainer.appendChild(specsList);
  }
  
  // 价格
  document.getElementById('modal-product-price').textContent = formatPrice(product.price);
  const originalPriceElement = document.getElementById('modal-product-original');
  
  if (product.originalPrice && product.originalPrice > product.price) {
    originalPriceElement.textContent = formatPrice(product.originalPrice);
    originalPriceElement.style.display = 'block';
  } else {
    originalPriceElement.style.display = 'none';
  }
  
  // 库存状态
  const inventoryStatus = document.getElementById('modal-inventory-status');
  const quantityInput = document.getElementById('modal-quantity');
  const addToCartBtn = document.getElementById('modal-add-to-cart');
  
  if (product.inventory !== undefined) {
    if (product.inventory > 0) {
      inventoryStatus.textContent = `有库存 (${product.inventory}可用)`;
      inventoryStatus.className = 'inventory-status in-stock';
      quantityInput.max = product.inventory;
      quantityInput.value = 1;
      addToCartBtn.disabled = false;
    } else {
      inventoryStatus.textContent = '无库存';
      inventoryStatus.className = 'inventory-status out-of-stock';
      addToCartBtn.disabled = true;
    }
  } else {
    inventoryStatus.style.display = 'none';
    quantityInput.max = 99;
    quantityInput.value = 1;
    addToCartBtn.disabled = false;
  }
  
  // 设置数量控制事件
  document.getElementById('modal-decrease-quantity').addEventListener('click', function() {
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
      quantityInput.value = currentValue - 1;
    }
  });
  
  document.getElementById('modal-increase-quantity').addEventListener('click', function() {
    const currentValue = parseInt(quantityInput.value);
    const max = parseInt(quantityInput.max) || 99;
    if (currentValue < max) {
      quantityInput.value = currentValue + 1;
    }
  });
  
  // 设置添加到购物车事件
  addToCartBtn.addEventListener('click', function() {
    const quantity = parseInt(quantityInput.value);
    addToCart(productId, quantity);
    closeProductDetails();
  });
  
  // 显示模态框
  const modal = document.getElementById('product-details-modal');
  modal.style.display = 'block';
  
  // 关闭按钮事件
  document.querySelector('.modal-close').addEventListener('click', closeProductDetails);
  
  // 点击模态框外部关闭
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      closeProductDetails();
    }
  });
}

// 关闭产品详情模态框
function closeProductDetails() {
  const modal = document.getElementById('product-details-modal');
  modal.style.display = 'none';
}

// 格式化规格名称
function formatSpecName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, function(str) { return str.toUpperCase(); })
    .trim();
}

// 将一组产品添加到购物车
function addBundleToCart(bundle) {
  // 对于每个产品，添加到购物车
  bundle.items.forEach(item => {
    addToCart(item.id, item.quantity, false);
  });
  
  // 更新UI和显示通知
  updateCartDisplay();
  showNotification(`已添加组合"${bundle.name}"到购物车`, 'success');
}

// 从URL加载筛选条件
function loadFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  
  // 基本筛选
  if (params.has('thickness')) state.filters.thickness = params.get('thickness');
  if (params.has('width')) state.filters.width = params.get('width');
  if (params.has('length')) state.filters.length = params.get('length');
  if (params.has('stock')) state.filters.stock = params.get('stock');
  if (params.has('sort')) state.filters.sort = params.get('sort');
  
  // 形状筛选
  state.filters.shapes = params.getAll('shape');
  document.querySelectorAll('.shape-option').forEach(option => {
    const shape = option.dataset.shape;
    if (state.filters.shapes.includes(shape)) {
      option.classList.add('selected');
    }
  });
  
  // 材料筛选
  state.filters.materials = params.getAll('material');
  document.querySelectorAll('input[name="material"]').forEach(checkbox => {
    if (state.filters.materials.includes(checkbox.value)) {
      checkbox.checked = true;
    }
  });
  
  // 价格范围
  if (params.has('minPrice')) {
    state.filters.priceRange.min = parseFloat(params.get('minPrice'));
    document.getElementById('min-price').value = state.filters.priceRange.min;
  }
  
  if (params.has('maxPrice')) {
    state.filters.priceRange.max = parseFloat(params.get('maxPrice'));
    document.getElementById('max-price').value = state.filters.priceRange.max;
  }
  
  // 页码
  if (params.has('page')) {
    state.currentPage = parseInt(params.get('page'));
  }
  
  // 更新UI元素
  document.getElementById('thickness-filter').value = state.filters.thickness;
  document.getElementById('width-filter').value = state.filters.width;
  document.getElementById('length-filter').value = state.filters.length;
  document.getElementById('stock-filter').value = state.filters.stock;
  document.getElementById('sort-filter').value = state.filters.sort;
  
  updatePriceRangeLabels();
}

// 显示错误消息
function showError(title, message) {
  // 实现错误提示
  console.error(title + ': ' + message);
  showNotification(message, 'error');
}

// 显示通知消息
function showNotification(message, type = 'info') {
  const notification = document.getElementById('notification');
  
  // 设置消息和类型
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  // 显示通知
  notification.classList.add('show');
  
  // 自动关闭
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// 初始化页面
document.addEventListener('DOMContentLoaded', init); 