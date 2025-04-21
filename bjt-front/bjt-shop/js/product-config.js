/**
 * BJT Shop - Product Configuration System
 * 处理产品配置、多级配件选择以及购物车交互
 */

const productConfigSystem = {
    // State management
    state: {
        selectedMachine: null,
        selectedAccessories: {
            level1: [],
            level2: [],
            level3: [],
            level4: [],
            level5: []
        },
        filters: {
            voltage: 'all',
            frequency: 'all',
            sortBy: 'default'
        },
        products: {
            machines: [],
            accessories: {
                level1: [],
                level2: [],
                level3: [],
                level4: [],
                level5: []
            }
        },
        loading: {
            machines: true,
            accessories: {
                level1: false,
                level2: false,
                level3: false,
                level4: false,
                level5: false
            }
        },
        userType: 'standard' // standard, distributor, enterprise
    },

    // Initialize the configuration system
    init: function() {
        this.loadUserInfo();
        this.setupEventListeners();
        this.loadMachines();
    },

    // Load user information from localStorage or API
    loadUserInfo: function() {
        // Simulate user type for now - in real app would come from authentication
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            this.state.userType = user.type || 'standard';
        }
        
        // Update UI based on user type
        document.body.setAttribute('data-user-type', this.state.userType);
    },

    // Set up event listeners for the configuration interface
    setupEventListeners: function() {
        // Filter listeners
        document.getElementById('voltage-filter').addEventListener('change', (e) => {
            this.state.filters.voltage = e.target.value;
            this.applyFilters();
        });

        document.getElementById('frequency-filter').addEventListener('change', (e) => {
            this.state.filters.frequency = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sort-options').addEventListener('change', (e) => {
            this.state.filters.sortBy = e.target.value;
            this.applyFilters();
        });

        // Section toggling
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.currentTarget.closest('.config-section');
                section.classList.toggle('collapsed');
                
                // Update the toggle icon
                const icon = e.currentTarget.querySelector('.toggle-icon');
                if (section.classList.contains('collapsed')) {
                    icon.innerHTML = '<i class="fas fa-chevron-down"></i>';
                } else {
                    icon.innerHTML = '<i class="fas fa-chevron-up"></i>';
                }
            });
        });
    },

    // Load machine data from API
    loadMachines: function() {
        this.state.loading.machines = true;
        this.updateLoadingState('machines');
        
        // In a real app, this would be an API call
        fetch('/data/products.json')
            .then(response => response.json())
            .then(data => {
                this.state.products.machines = data.machines || [];
                this.state.loading.machines = false;
                this.updateLoadingState('machines');
                this.renderMachines();
            })
            .catch(error => {
                console.error('Error loading machines:', error);
                this.state.loading.machines = false;
                this.updateLoadingState('machines');
            });
    },

    // Load accessories based on selected machine
    loadAccessories: function(level, parentId = null) {
        // Reset selections for this level and all deeper levels
        for (let i = level; i <= 5; i++) {
            this.state.selectedAccessories[`level${i}`] = [];
            this.state.products.accessories[`level${i}`] = [];
            this.state.loading.accessories[`level${i}`] = false;
        }
        
        // If no parent selected, clear the accessory section and return
        if (!parentId) {
            for (let i = level; i <= 5; i++) {
                this.renderAccessories(i);
            }
            return;
        }
        
        // Start loading
        this.state.loading.accessories[`level${level}`] = true;
        this.updateLoadingState(`accessories-level${level}`);
        
        // In a real app, this would be an API call with the parent ID as a parameter
        fetch('/data/products.json')
            .then(response => response.json())
            .then(data => {
                // Filter accessories based on compatibility with parent
                const allAccessories = [...data.consumables || [], ...data.spareParts || []];
                
                let compatibleAccessories = [];
                if (level === 1) {
                    // For level 1, filter by machine compatibility
                    compatibleAccessories = allAccessories.filter(accessory => 
                        accessory.compatibleModels && 
                        accessory.compatibleModels.includes(parentId)
                    );
                } else {
                    // For deeper levels, filter by parent accessory compatibility
                    compatibleAccessories = allAccessories.filter(accessory => 
                        accessory.compatibleAccessories && 
                        accessory.compatibleAccessories.includes(parentId)
                    );
                }
                
                this.state.products.accessories[`level${level}`] = compatibleAccessories;
                this.state.loading.accessories[`level${level}`] = false;
                this.updateLoadingState(`accessories-level${level}`);
                this.renderAccessories(level);
                
                // Make the section visible
                document.getElementById(`accessories-level${level}-section`).classList.remove('hidden');
            })
            .catch(error => {
                console.error(`Error loading level ${level} accessories:`, error);
                this.state.loading.accessories[`level${level}`] = false;
                this.updateLoadingState(`accessories-level${level}`);
            });
    },

    // Render machines to the UI
    renderMachines: function() {
        const machinesContainer = document.getElementById('machines-list');
        machinesContainer.innerHTML = '';
        
        // Filter and sort machines based on current filters
        const filteredMachines = this.filterAndSortProducts(this.state.products.machines);
        
        if (filteredMachines.length === 0) {
            machinesContainer.innerHTML = '<div class="no-results">No machines match your filters</div>';
            return;
        }
        
        filteredMachines.forEach(machine => {
            const template = document.getElementById('product-item-template');
            const productElement = document.importNode(template.content, true);
            
            // Set machine data
            productElement.querySelector('.product-item').dataset.productId = machine.id;
            productElement.querySelector('.product-name').textContent = machine.name;
            productElement.querySelector('.product-image').src = machine.image;
            productElement.querySelector('.product-image').alt = machine.name;
            productElement.querySelector('.product-description').textContent = machine.shortDescription;
            
            // Set price based on user type
            let price = machine.price;
            if (this.state.userType === 'distributor' && machine.distributorPrice) {
                price = machine.distributorPrice;
            } else if (this.state.userType === 'enterprise' && machine.enterprisePrice) {
                price = machine.enterprisePrice;
            }
            
            productElement.querySelector('.product-price').textContent = `¥${price.toLocaleString()}`;
            
            // If there's an original price and it's higher than the current price, show it
            if (machine.originalPrice && machine.originalPrice > price) {
                productElement.querySelector('.product-original-price').textContent = `¥${machine.originalPrice.toLocaleString()}`;
                productElement.querySelector('.product-original-price').classList.remove('hidden');
            }
            
            // Specifications
            const specsList = productElement.querySelector('.product-specs');
            const mainSpecs = machine.specifications || {};
            const highlights = Object.entries(mainSpecs).slice(0, 3);
            
            highlights.forEach(([key, value]) => {
                const li = document.createElement('li');
                li.textContent = `${key}: ${value}`;
                specsList.appendChild(li);
            });
            
            // Set up radio button
            const radioInput = productElement.querySelector('.product-select input');
            radioInput.value = machine.id;
            radioInput.id = `machine-${machine.id}`;
            radioInput.checked = this.state.selectedMachine === machine.id;
            
            radioInput.addEventListener('change', () => {
                if (radioInput.checked) {
                    this.selectMachine(machine.id);
                }
            });
            
            // Set up buttons
            productElement.querySelector('.view-details').addEventListener('click', () => {
                this.showProductDetails(machine);
            });
            
            productElement.querySelector('.spec-download').addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadSpec(machine.id);
            });
            
            productElement.querySelector('.add-to-cart').addEventListener('click', () => {
                this.addToCart(machine);
            });
            
            machinesContainer.appendChild(productElement);
        });
    },

    // Render accessories for a specific level
    renderAccessories: function(level) {
        const accessoriesContainer = document.getElementById(`accessories-level${level}-list`);
        if (!accessoriesContainer) return;
        
        accessoriesContainer.innerHTML = '';
        
        // Get accessories for this level
        const accessories = this.state.products.accessories[`level${level}`];
        
        // If no accessories, hide the section
        if (accessories.length === 0) {
            document.getElementById(`accessories-level${level}-section`).classList.add('hidden');
            
            // Also hide deeper levels
            for (let i = level + 1; i <= 5; i++) {
                document.getElementById(`accessories-level${i}-section`).classList.add('hidden');
            }
            
            return;
        }
        
        // Show section
        document.getElementById(`accessories-level${level}-section`).classList.remove('hidden');
        
        // Filter and sort accessories
        const filteredAccessories = this.filterAndSortProducts(accessories);
        
        if (filteredAccessories.length === 0) {
            accessoriesContainer.innerHTML = '<div class="no-results">No accessories match your filters</div>';
            return;
        }
        
        filteredAccessories.forEach(accessory => {
            const template = document.getElementById('product-item-template');
            const productElement = document.importNode(template.content, true);
            
            // Set accessory data
            productElement.querySelector('.product-item').dataset.productId = accessory.id;
            productElement.querySelector('.product-name').textContent = accessory.name;
            productElement.querySelector('.product-image').src = accessory.image;
            productElement.querySelector('.product-image').alt = accessory.name;
            productElement.querySelector('.product-description').textContent = accessory.shortDescription;
            
            // Set price based on user type and quantity tiers if available
            let price = accessory.price;
            if (accessory.priceTiers && accessory.priceTiers.length > 0) {
                // Default to the first tier
                price = accessory.priceTiers[0].price;
                
                // Add quantity selector for tiered pricing
                const quantitySelector = document.createElement('select');
                quantitySelector.className = 'form-select quantity-select';
                
                accessory.priceTiers.forEach(tier => {
                    const option = document.createElement('option');
                    option.value = tier.quantity;
                    option.textContent = `${tier.quantity} ${tier.quantity === 1 ? 'unit' : 'units'} - ¥${tier.price}`;
                    quantitySelector.appendChild(option);
                });
                
                // Replace price element with quantity selector
                const priceEl = productElement.querySelector('.product-price');
                priceEl.parentNode.replaceChild(quantitySelector, priceEl);
                
                // Update price when quantity changes
                quantitySelector.addEventListener('change', (e) => {
                    const selectedTier = accessory.priceTiers.find(tier => tier.quantity == e.target.value);
                    if (selectedTier) {
                        price = selectedTier.price;
                    }
                });
            } else {
                // Standard pricing
                if (this.state.userType === 'distributor' && accessory.distributorPrice) {
                    price = accessory.distributorPrice;
                } else if (this.state.userType === 'enterprise' && accessory.enterprisePrice) {
                    price = accessory.enterprisePrice;
                }
                
                productElement.querySelector('.product-price').textContent = `¥${price.toLocaleString()}`;
            }
            
            // Specifications
            const specsList = productElement.querySelector('.product-specs');
            const mainSpecs = accessory.specifications || {};
            const highlights = Object.entries(mainSpecs).slice(0, 3);
            
            highlights.forEach(([key, value]) => {
                const li = document.createElement('li');
                li.textContent = `${key}: ${value}`;
                specsList.appendChild(li);
            });
            
            // Set up radio button if this is a single-selection category
            const radioInput = productElement.querySelector('.product-select input');
            radioInput.value = accessory.id;
            radioInput.id = `accessory-${accessory.id}`;
            
            // For multi-select categories, change to checkbox
            if (accessory.multiSelect) {
                radioInput.type = 'checkbox';
                radioInput.checked = this.state.selectedAccessories[`level${level}`].includes(accessory.id);
                
                radioInput.addEventListener('change', () => {
                    if (radioInput.checked) {
                        this.selectAccessory(level, accessory.id, true);
                    } else {
                        this.unselectAccessory(level, accessory.id);
                    }
                });
            } else {
                radioInput.checked = this.state.selectedAccessories[`level${level}`][0] === accessory.id;
                
                radioInput.addEventListener('change', () => {
                    if (radioInput.checked) {
                        this.selectAccessory(level, accessory.id, false);
                    }
                });
            }
            
            // Set up buttons
            productElement.querySelector('.view-details').addEventListener('click', () => {
                this.showProductDetails(accessory);
            });
            
            productElement.querySelector('.spec-download').addEventListener('click', (e) => {
                e.preventDefault();
                this.downloadSpec(accessory.id);
            });
            
            productElement.querySelector('.add-to-cart').addEventListener('click', () => {
                // Get quantity if there's a selector
                let quantity = 1;
                const quantitySelector = productElement.querySelector('.quantity-select');
                if (quantitySelector) {
                    quantity = parseInt(quantitySelector.value);
                }
                
                this.addToCart(accessory, quantity);
            });
            
            accessoriesContainer.appendChild(productElement);
        });
    },

    // Select a machine
    selectMachine: function(machineId) {
        this.state.selectedMachine = machineId;
        
        // Highlight the selected machine
        document.querySelectorAll('#machines-list .product-item').forEach(item => {
            if (item.dataset.productId === machineId) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
        
        // Load first level accessories
        this.loadAccessories(1, machineId);
    },

    // Select an accessory
    selectAccessory: function(level, accessoryId, isMultiSelect) {
        if (isMultiSelect) {
            // For multi-select, add to array if not already present
            if (!this.state.selectedAccessories[`level${level}`].includes(accessoryId)) {
                this.state.selectedAccessories[`level${level}`].push(accessoryId);
            }
        } else {
            // For single-select, replace the array
            this.state.selectedAccessories[`level${level}`] = [accessoryId];
            
            // Highlight the selected accessory
            document.querySelectorAll(`#accessories-level${level}-list .product-item`).forEach(item => {
                if (item.dataset.productId === accessoryId) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            });
        }
        
        // Load next level accessories
        this.loadAccessories(level + 1, accessoryId);
    },

    // Unselect an accessory (for multi-select)
    unselectAccessory: function(level, accessoryId) {
        this.state.selectedAccessories[`level${level}`] = 
            this.state.selectedAccessories[`level${level}`].filter(id => id !== accessoryId);
            
        // If this was the last selected accessory at this level, clear deeper levels
        if (this.state.selectedAccessories[`level${level}`].length === 0) {
            this.loadAccessories(level + 1);
        }
    },

    // Filter and sort products based on current filters
    filterAndSortProducts: function(products) {
        let filtered = [...products];
        
        // Apply voltage filter
        if (this.state.filters.voltage !== 'all') {
            filtered = filtered.filter(product => {
                return product.specifications && 
                       product.specifications.voltage && 
                       product.specifications.voltage.includes(this.state.filters.voltage);
            });
        }
        
        // Apply frequency filter
        if (this.state.filters.frequency !== 'all') {
            filtered = filtered.filter(product => {
                return product.specifications && 
                       product.specifications.frequency && 
                       product.specifications.frequency.includes(this.state.filters.frequency);
            });
        }
        
        // Apply sorting
        switch(this.state.filters.sortBy) {
            case 'price-asc':
                filtered.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                filtered.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            // Default sorting is by featured status or ID
            default:
                filtered.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return a.id.localeCompare(b.id);
                });
        }
        
        return filtered;
    },

    // Apply filters and re-render products
    applyFilters: function() {
        this.renderMachines();
        
        // Re-render all visible accessory levels
        for (let i = 1; i <= 5; i++) {
            if (this.state.products.accessories[`level${i}`].length > 0) {
                this.renderAccessories(i);
            }
        }
    },

    // Update loading state for a section
    updateLoadingState: function(section) {
        let isLoading = false;
        
        if (section === 'machines') {
            isLoading = this.state.loading.machines;
        } else if (section.startsWith('accessories-level')) {
            const level = section.replace('accessories-level', '');
            isLoading = this.state.loading.accessories[`level${level}`];
        }
        
        const loadingElement = document.querySelector(`#${section}-list .loading-indicator`);
        if (loadingElement) {
            if (isLoading) {
                loadingElement.classList.remove('hidden');
            } else {
                loadingElement.classList.add('hidden');
            }
        }
    },

    // Show product details modal
    showProductDetails: function(product) {
        // In a real app, this would show a modal with product details
        alert(`Product details for ${product.name} would be shown in a modal`);
    },

    // Download specification PDF
    downloadSpec: function(productId) {
        // In a real app, this would download or open a spec PDF
        alert(`Specification PDF for product ID ${productId} would be downloaded`);
    },

    // Add product to cart
    addToCart: function(product, quantity = 1) {
        if (typeof cart !== 'undefined' && typeof cart.addItem === 'function') {
            cart.addItem(product, quantity);
        } else {
            console.error('Cart module not loaded');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load header and footer
    fetch('/components/header.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
        });
        
    fetch('/components/footer.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('footer-placeholder').innerHTML = html;
        });
    
    // Initialize cart
    if (typeof cart !== 'undefined' && typeof cart.init === 'function') {
        cart.init();
    }
    
    // Initialize product configuration system
    productConfigSystem.init();
}); 