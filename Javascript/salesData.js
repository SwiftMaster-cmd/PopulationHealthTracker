// salesData.js

import { database } from './firebase.js';

// Function to fetch sales history based on filters
function fetchSalesHistory(timeFilter = 'all', saleTypeFilter = 'all', esiFilter = 'all', timeSort = 'newest', leadIdFilter = '') {
    if (!userId) {
        console.log("Attempted to fetch sales history without a valid user ID.");
        return;
    }

    const salesRef = ref(database, `sales/${userId}`);
    onValue(salesRef, (snapshot) => {
        const salesHistoryElement = document.getElementById('salesHistory');
        salesHistoryElement.innerHTML = ''; // Clear existing content

        let sales = snapshot.val();
        if (!sales) {
            salesHistoryElement.innerHTML = '<div>No sales history found.</div>';
            return;
        }

        let salesArray = Object.keys(sales).map(key => ({
            ...sales[key],
            id: key
        }));

        salesArray = applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter);

        if (timeSort === 'newest') {
            salesArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } else if (timeSort === 'oldest') {
            salesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        }

        // Initialize an object to track cumulative sale type counts
        let cumulativeSaleTypeCounts = {};

        // If we are viewing the newest first, we will accumulate counts from the end
        if (timeSort === 'newest') {
            for (let i = salesArray.length - 1; i >= 0; i--) {
                updateCumulativeSaleTypeCounts(cumulativeSaleTypeCounts, salesArray[i].sale_types);
                salesArray[i].cumulativeSaleTypes = {...cumulativeSaleTypeCounts}; // Clone the current state for the sale
            }
        } else {
            // Accumulate counts from the beginning for oldest first
            salesArray.forEach(sale => {
                updateCumulativeSaleTypeCounts(cumulativeSaleTypeCounts, sale.sale_types);
                sale.cumulativeSaleTypes = {...cumulativeSaleTypeCounts}; // Clone the current state for the sale
            });
        }

        salesArray.forEach((sale) => {
            const formattedTimestamp = sale.timestamp ? new Date(sale.timestamp).toLocaleString() : 'Unknown';
            const saleContainerHTML = generateSaleEntryHTML(sale, formattedTimestamp, sale.cumulativeSaleTypes);
            const saleContainer = document.createElement('div');
            saleContainer.className = 'sales-history-entry';
            saleContainer.setAttribute('data-sale-id', sale.id);
            saleContainer.innerHTML = saleContainerHTML;
            salesHistoryElement.appendChild(saleContainer);
        });

         // After fetching the sales history and rendering the sales entries, generate and render the chart
         const chartData = generateChartData(salesArray);
         renderSalesChart(chartData);
 
         // Execute the callback if provided
         if (callback && typeof callback === 'function') {
             callback();
         }
    });
}

// Function to apply filters to sales data
function applyFilters(salesArray, timeFilter, saleTypeFilter, esiFilter, leadIdFilter) {
    const now = new Date();
    return salesArray.filter(sale => {
        // Time filter
        const saleDate = new Date(sale.timestamp);
        if (timeFilter === 'day' && saleDate.toDateString() !== now.toDateString()) return false;
        if (timeFilter === 'week' && (now - saleDate) / (1000 * 60 * 60 * 24) > 7) return false;
        if (timeFilter === 'month' && (saleDate.getMonth() !== now.getMonth() || saleDate.getFullYear() !== now.getFullYear())) return false;

        // Sale type filter
        if (saleTypeFilter !== 'all' && (!sale.sale_types || !sale.sale_types[saleTypeFilter])) return false;

        // ESI filter
        if (esiFilter !== 'all' && sale.esi_content !== esiFilter) return false;

        // Lead ID filter
        if (leadIdFilter && sale.lead_id !== leadIdFilter) return false;

        return true; // Include sale if all filters match
    });
}

// Function to update cumulative sale type counts
function updateCumulativeSaleTypeCounts(cumulativeCounts, currentSaleTypes) {
    Object.keys(currentSaleTypes || {}).forEach(type => {
        if (!cumulativeCounts[type]) {
            cumulativeCounts[type] = currentSaleTypes[type];
        } else {
            cumulativeCounts[type] += currentSaleTypes[type];
        }
    });
}

// Function to generate HTML for a single sale entry
function generateSaleEntryHTML(sale, formattedTimestamp, cumulativeSaleTypeCounts) {
    let saleTypesDisplay = '';

    // Filter out sale types with zero counts and not present in the current sale
    const nonZeroCounts = Object.entries(cumulativeSaleTypeCounts).filter(([type, count]) =>
        count > 0 && sale.sale_types && sale.sale_types[type] !== undefined
    );

    // Generate display string for sale types with non-zero counts that are present in the current sale
    saleTypesDisplay = nonZeroCounts.map(([type, count]) =>
        `<span class="sale-type-span">${type}: ${count}</span>`
    ).join(''); // Removed the comma from the join function

    // Check if any sale types are present before generating HTML
    if (saleTypesDisplay !== '') {
        return `
            <div class="sale-info">
                <div class="sale-data lead-id">Lead ID: ${sale.lead_id}</div>
                <div class="sale-data esi">ESI: ${sale.esi_content || 'N/A'}</div>
                <div class="sale-types">${saleTypesDisplay}</div>
                <div class="sale-note">${sale.notes}</div>
                <div class="sale-footer">
                    <div class="sale-timestamp">Time: ${formattedTimestamp}</div>
                    <div class="sale-actions">
                        <button class="edit-btn" data-sale-id="${sale.id}">Edit</button>
                        <button class="delete-btn" data-sale-id="${sale.id}">Delete</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // If no sale types are present, return an empty string
        return '';
    }
}

// Function to calculate sale type counts
function calculateSaleTypeCounts(salesArray) {
    let saleTypeCounts = {};
    salesArray.forEach(sale => {
        Object.keys(sale.sale_types || {}).forEach(type => {
            if (!saleTypeCounts[type]) {
                saleTypeCounts[type] = sale.sale_types[type];
            } else {
                saleTypeCounts[type] += sale.sale_types[type];
            }
        });
    });
    return saleTypeCounts;
}

// Function to generate chart data from sales data
function generateChartData(salesArray) {
    const saleTypeCounts = calculateSaleTypeCounts(salesArray);
    const labels = Object.keys(saleTypeCounts);
    const data = Object.values(saleTypeCounts);

    return {
        labels: labels,
        datasets: [{
            label: 'Sale Type Counts',
            backgroundColor: 'rgba(54, 162, 235, 0.8)', // Blue color with opacity
            data: data,
        }]
    };
}

// Function to render the sales chart
function renderSalesChart(data) {
    if (salesChart) {
        salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)', // Light gray grid lines
                    },
                    ticks: {
                        maxTicksLimit: 5 // Attempt to limit to 5 ticks
                    }
                },
                x: {
                    grid: {
                        display: false // Hide vertical grid lines
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Hide legend
                }
            },
            animation: {
                duration: 2000, // Animates the chart over 2 seconds
                easing: 'easeInOutQuart' // Smooth animation curve
            },
            responsive: true,
            maintainAspectRatio: false // Allow chart to resize
        }
    });
}

export { fetchSalesHistory };
