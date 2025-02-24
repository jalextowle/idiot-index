document.addEventListener('DOMContentLoaded', () => {
    const sortBy = document.getElementById('sortBy');
    const productsTableBody = document.getElementById('productsTableBody');

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
        } catch (error) {
            console.error('Error loading products:', error);
        }
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
        productsTableBody.innerHTML = products.map(product => `
            <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-2">
                    <a href="/products/${product.id}" class="text-blue-500 hover:text-blue-700">
                        ${product.name}
                    </a>
                    <div class="text-sm text-gray-500">${product.description || ''}</div>
                </td>
                <td class="px-4 py-2">$${product.retail_price.toFixed(2)}</td>
                <td class="px-4 py-2">$${product.materials_cost.toFixed(2)}</td>
                <td class="px-4 py-2">${product.idiot_index ? product.idiot_index.toFixed(2) : 'N/A'}</td>
                <td class="px-4 py-2">
                    ${product.components.length ? 
                        `${product.components.length} components` : 
                        '<span class="text-gray-500">Raw Material</span>'}
                </td>
            </tr>
        `).join('');
    }
});
