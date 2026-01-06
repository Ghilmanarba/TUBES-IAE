import { Auth } from './auth.js';
import { initLayout } from './layout.js';
import { fetchGraphQL, GRAPHQL_URLS } from './api.js';
import { formatRupiah } from './utils.js';

// Init
Auth.requireAuth();
initLayout();

const user = Auth.getUser();
if (user) {
    document.getElementById('user-name').textContent = user.fullName;
}

const statsContainer = document.getElementById('stats-container');
const revenueChartCtx = document.getElementById('revenueChart').getContext('2d');
const stockChartCtx = document.getElementById('stockChart').getContext('2d');

let revenueChartInstance = null;
let stockChartInstance = null;

async function loadDashboardData() {
    try {
        // Fetch Data
        const transQuery = `query { dashboardStats { totalTransactions totalRevenue revenueChart { date value } } }`;
        const transData = await fetchGraphQL(GRAPHQL_URLS.TRANSACTION, transQuery);
        const tStats = transData.dashboardStats;

        const invQuery = `query { medicines { name stock } }`;
        const invData = await fetchGraphQL(GRAPHQL_URLS.INVENTORY, invQuery);
        const medicines = invData.medicines || [];

        // Process Data
        const criticalStock = medicines.filter(m => m.stock < 10).length;
        const stockChartData = medicines.map(m => ({ name: m.name, stock: m.stock }));

        // Render Stats
        renderStats({
            totalTransactions: tStats.totalTransactions,
            totalRevenue: tStats.totalRevenue,
            medicinesCount: medicines.length,
            criticalStockCount: criticalStock
        });

        // Render Charts
        renderCharts(tStats.revenueChart, stockChartData);

    } catch (error) {
        console.error(error);
        statsContainer.innerHTML = `<div class="col-span-full p-4 bg-red-50 text-red-600 rounded-lg">Gagal memuat data: ${error.message}</div>`;
    }
}

function renderStats(stats) {
    const statItems = [
        { label: 'Total Transaksi', value: stats.totalTransactions, icon: 'shopping-cart', color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Pendapatan', value: formatRupiah(stats.totalRevenue), icon: 'trending-up', color: 'text-green-600', bg: 'bg-green-100' },
        { label: 'Jenis Obat', value: stats.medicinesCount, icon: 'users', color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Stok Kritis (<10)', value: stats.criticalStockCount, icon: 'activity', color: 'text-red-600', bg: 'bg-red-100' },
    ];

    statsContainer.innerHTML = statItems.map(item => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div class="p-3 rounded-lg ${item.bg} ${item.color}">
                <i data-lucide="${item.icon}" class="w-6 h-6"></i>
            </div>
            <div>
                <p class="text-sm font-medium text-slate-500">${item.label}</p>
                <h3 class="text-2xl font-bold text-slate-900">${item.value}</h3>
            </div>
        </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
}

function renderCharts(revenueData, stockData) {
    // Revenue Line Chart
    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(revenueChartCtx, {
        type: 'line',
        data: {
            labels: revenueData.map(d => d.date),
            datasets: [{
                label: 'Pendapatan',
                data: revenueData.map(d => d.value),
                borderColor: '#16a34a', // green-600
                backgroundColor: 'rgba(22, 163, 74, 0.1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => formatRupiah(ctx.raw)
                    }
                }
            }
        }
    });

    // Stock Bar Chart
    if (stockChartInstance) stockChartInstance.destroy();
    stockChartInstance = new Chart(stockChartCtx, {
        type: 'bar',
        data: {
            labels: stockData.map(d => d.name),
            datasets: [{
                label: 'Stok',
                data: stockData.map(d => d.stock),
                backgroundColor: '#3b82f6', // blue-500
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

loadDashboardData();
