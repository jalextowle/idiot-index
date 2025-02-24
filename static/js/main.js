document.addEventListener('DOMContentLoaded', () => {
    const calculateForm = document.getElementById('calculateForm');
    const resultDiv = document.getElementById('result');
    const productsList = document.getElementById('productsList');

    // Load existing products
    loadProducts();

    calculateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = document.getElementById('productUrl').value;
        
        try {
            calculateForm.classList.add('loading');
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error('Failed to calculate index');
            }

            const data = await response.json();
            displayResult(data);
            loadProducts(); // Refresh the products list
        } catch (error) {
            alert('Error calculating index: ' + error.message);
        } finally {
            calculateForm.classList.remove('loading');
        }
    });

    async function loadProducts() {
        try {
            const response = await fetch('/api/products');
            const products = await response.json();
            
            productsList.innerHTML = products.map(product => `
                <tr>
                    <td class="border px-4 py-2">${escapeHtml(product.name)}</td>
                    <td class="border px-4 py-2">$${product.retail_price.toFixed(2)}</td>
                    <td class="border px-4 py-2">$${product.materials_cost.toFixed(2)}</td>
                    <td class="border px-4 py-2 ${getIdiotIndexClass(product.idiot_index)}">
                        ${product.idiot_index.toFixed(1)}x
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading products:', error);
        }
    }

    function displayResult(data) {
        document.getElementById('productName').textContent = data.product_name;
        document.getElementById('retailPrice').textContent = data.retail_price.toFixed(2);
        document.getElementById('materialsCost').textContent = data.materials_cost.toFixed(2);
        document.getElementById('idiotIndex').textContent = `${data.idiot_index.toFixed(1)}x`;
        document.getElementById('idiotIndex').className = getIdiotIndexClass(data.idiot_index);
        resultDiv.classList.remove('hidden');
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
