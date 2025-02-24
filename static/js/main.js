document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const viewToggle = document.getElementById('viewToggle');
    const sortBy = document.getElementById('sortBy');
    const productsGrid = document.getElementById('productsGrid');
    const productsList = document.getElementById('productsList');

    let products = [];
    let currentView = 'grid';

    // Load products on page load
    loadProducts();

    // Event Listeners
    productForm.addEventListener('submit', handleProductSubmit);
    viewToggle.addEventListener('click', toggleView);
    sortBy.addEventListener('change', handleSort);

    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            products = await response.json();
            renderProducts();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    async function handleProductSubmit(event) {
        event.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value,
            description: document.getElementById('productDescription').value,
            retail_price: parseFloat(document.getElementById('retailPrice').value),
            source_url: document.getElementById('sourceUrl').value || null
        };

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create product');
            }

            const newProduct = await response.json();
            products.push(newProduct);
            renderProducts();
            productForm.reset();

        } catch (error) {
            console.error('Error creating product:', error);
            alert(error.message);
        }
    }

    function toggleView() {
        currentView = currentView === 'grid' ? 'list' : 'grid';
        productsGrid.classList.toggle('hidden');
        productsList.classList.toggle('hidden');
        renderProducts();
    }

    function handleSort() {
        const sortValue = sortBy.value;
        products.sort((a, b) => {
            if (sortValue === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortValue === 'retail_price') {
                return a.retail_price - b.retail_price;
            } else if (sortValue === 'idiot_index') {
                const aIndex = a.idiot_index || Infinity;
                const bIndex = b.idiot_index || Infinity;
                return aIndex - bIndex;
            }
        });
        renderProducts();
    }

    function renderProducts() {
        if (currentView === 'grid') {
            renderGridView();
        } else {
            renderListView();
        }
    }

    function renderGridView() {
        productsGrid.innerHTML = products.map(product => `
            <div class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow">
                <h3 class="text-xl font-semibold mb-2">${product.name}</h3>
                <p class="text-gray-600 mb-2">${product.description || ''}</p>
                <div class="space-y-1">
                    <p><span class="font-medium">Retail Price:</span> $${product.retail_price.toFixed(2)}</p>
                    <p><span class="font-medium">Materials Cost:</span> $${product.materials_cost.toFixed(2)}</p>
                    <p><span class="font-medium">Idiot Index:</span> ${product.idiot_index ? product.idiot_index.toFixed(2) : 'N/A'}</p>
                    <p><span class="font-medium">Components:</span> ${product.components.length}</p>
                </div>
                ${product.source_url ? `
                    <a href="${product.source_url}" target="_blank" 
                       class="text-blue-500 hover:text-blue-700 text-sm block mt-2">
                        View Source
                    </a>
                ` : ''}
            </div>
        `).join('');
    }

    function renderListView() {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = products.map(product => `
            <tr class="border-t">
                <td class="px-4 py-2">
                    <div class="font-medium">${product.name}</div>
                    <div class="text-sm text-gray-500">${product.description || ''}</div>
                </td>
                <td class="px-4 py-2">$${product.retail_price.toFixed(2)}</td>
                <td class="px-4 py-2">$${product.materials_cost.toFixed(2)}</td>
                <td class="px-4 py-2">${product.idiot_index ? product.idiot_index.toFixed(2) : 'N/A'}</td>
                <td class="px-4 py-2">${product.components.length}</td>
            </tr>
        `).join('');
    }
});
