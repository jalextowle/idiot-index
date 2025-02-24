document.addEventListener('DOMContentLoaded', () => {
    const sortBy = document.getElementById('sortBy');
    const productsTableBody = document.getElementById('productsTableBody');
    const totalProductsEl = document.getElementById('totalProducts');
    const rawMaterialsEl = document.getElementById('rawMaterials');
    const avgIdiotIndexEl = document.getElementById('avgIdiotIndex');

    let products = [];

    // Load products on page load
    loadProducts();

    // Event Listeners
    sortBy.addEventListener('change', handleSort);

    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            products = await response.json();
            renderProducts();
            updateStats();
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function updateStats() {
        // Total products
        totalProductsEl.textContent = products.length;

        // Raw materials (products with no components)
        const rawMaterialsCount = products.filter(p => p.components.length === 0).length;
        rawMaterialsEl.textContent = rawMaterialsCount;

        // Average idiot index
        const validIdiotIndices = products
            .map(p => p.idiot_index)
            .filter(index => index !== null && !isNaN(index));
        
        const avgIdiotIndex = validIdiotIndices.length > 0
            ? (validIdiotIndices.reduce((a, b) => a + b, 0) / validIdiotIndices.length).toFixed(2)
            : 'N/A';
        
        avgIdiotIndexEl.textContent = avgIdiotIndex;
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

    function formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }

    function renderProducts() {
        productsTableBody.innerHTML = products.map(product => `
            <tr class="product-row">
                <td class="px-6 py-4">
                    <div class="flex items-start">
                        <div>
                            <a href="/products/${product.id}" 
                               class="text-blue-600 hover:text-blue-800 font-medium">
                                ${product.name}
                            </a>
                            ${product.description ? `
                                <p class="text-sm text-gray-500 mt-1">${product.description}</p>
                            ` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-900">${formatCurrency(product.retail_price)}</td>
                <td class="px-6 py-4 text-gray-900">${formatCurrency(product.materials_cost)}</td>
                <td class="px-6 py-4">
                    ${product.idiot_index 
                        ? `<span class="font-medium ${product.idiot_index > 2 ? 'text-red-600' : 'text-green-600'}">
                             ${product.idiot_index.toFixed(2)}
                           </span>`
                        : '<span class="text-gray-400">N/A</span>'}
                </td>
                <td class="px-6 py-4">
                    ${product.components.length 
                        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                             ${product.components.length} components
                           </span>`
                        : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Raw Material</span>'}
                </td>
            </tr>
        `).join('');
    }
});
