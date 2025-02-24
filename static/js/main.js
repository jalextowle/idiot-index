document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const productsGrid = document.getElementById('productsGrid');
    const productsList = document.getElementById('productsList');
    const productsTableBody = document.getElementById('productsTableBody');
    const viewToggle = document.getElementById('viewToggle');
    const sortBy = document.getElementById('sortBy');
    const isRawMaterial = document.getElementById('isRawMaterial');
    const rawMaterialCostDiv = document.getElementById('rawMaterialCostDiv');

    // Load existing products
    loadProducts();

    // Toggle raw material cost input visibility
    isRawMaterial?.addEventListener('change', (e) => {
        rawMaterialCostDiv.classList.toggle('hidden', !e.target.checked);
        if (e.target.checked) {
            document.getElementById('rawMaterialCost').setAttribute('required', 'required');
        } else {
            document.getElementById('rawMaterialCost').removeAttribute('required');
        }
    });

    // Handle view toggle
    viewToggle?.addEventListener('click', () => {
        productsGrid.classList.toggle('hidden');
        productsList.classList.toggle('hidden');
    });

    // Handle sorting
    sortBy?.addEventListener('change', () => {
        loadProducts();
    });

    productForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                name: document.getElementById('productName').value,
                description: document.getElementById('productDescription').value,
                retail_price: parseFloat(document.getElementById('retailPrice').value),
                source_url: document.getElementById('sourceUrl').value,
                is_raw_material: document.getElementById('isRawMaterial').checked
            };

            if (formData.is_raw_material) {
                formData.raw_material_cost = parseFloat(document.getElementById('rawMaterialCost').value);
            }

            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const data = await response.json();
            productForm.reset();
            rawMaterialCostDiv.classList.add('hidden');
            loadProducts();
        } catch (error) {
            alert('Error creating product: ' + error.message);
        }
    });

    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            // Sort products
            const sortField = sortBy?.value || 'idiot_index';
            products.sort((a, b) => {
                if (sortField === 'name') {
                    return a.name.localeCompare(b.name);
                }
                return b[sortField] - a[sortField];
            });

            // Update grid view
            productsGrid.innerHTML = products.map(product => `
                <div class="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                    <h3 class="text-xl font-semibold mb-2">
                        <a href="/products/${product.id}" class="text-blue-500 hover:text-blue-700">
                            ${escapeHtml(product.name)}
                        </a>
                    </h3>
                    <p class="text-gray-600 mb-4 line-clamp-2">${escapeHtml(product.description || '')}</p>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-500">Retail Price</p>
                            <p class="font-semibold">$${product.retail_price.toFixed(2)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">Materials Cost</p>
                            <p class="font-semibold">$${product.materials_cost.toFixed(2)}</p>
                        </div>
                    </div>
                    <div class="mt-4 pt-4 border-t">
                        <p class="text-sm text-gray-500">Idiot Index</p>
                        <p class="text-xl font-bold ${getIdiotIndexClass(product.idiot_index)}">
                            ${product.idiot_index.toFixed(1)}x
                        </p>
                    </div>
                    ${product.is_raw_material ? '<div class="mt-2"><span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Raw Material</span></div>' : ''}
                </div>
            `).join('');

            // Update list view
            productsTableBody.innerHTML = products.map(product => `
                <tr class="border-t">
                    <td class="px-4 py-2">
                        <a href="/products/${product.id}" class="text-blue-500 hover:text-blue-700">
                            ${escapeHtml(product.name)}
                        </a>
                    </td>
                    <td class="px-4 py-2">$${product.retail_price.toFixed(2)}</td>
                    <td class="px-4 py-2">$${product.materials_cost.toFixed(2)}</td>
                    <td class="px-4 py-2 ${getIdiotIndexClass(product.idiot_index)}">
                        ${product.idiot_index.toFixed(1)}x
                    </td>
                    <td class="px-4 py-2">
                        ${product.is_raw_material ? '<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Raw Material</span>' : 'Product'}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function getIdiotIndexClass(index) {
        if (index >= 5) return 'idiot-index-high';
        if (index >= 2) return 'idiot-index-medium';
        return 'idiot-index-low';
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
