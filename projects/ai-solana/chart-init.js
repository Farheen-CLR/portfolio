// Simple chart initialization - exactly like chart-demo.html
const API_BASE_URL = 'https://solana-ai-traders-api.onrender.com';
let priceChart, marketChart;

// Initialize charts on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing charts...');
    
    // Wait a bit for DOM to be ready
    setTimeout(() => {
        initCharts();
        loadTokenData('SOL');
        loadMarketOverview();
    }, 100);
});

function initCharts() {
    // Initialize Price Chart
    const priceCanvas = document.getElementById('priceChart');
    if (priceCanvas) {
        const priceCtx = priceCanvas.getContext('2d');
        priceChart = new Chart(priceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Price (USD)',
                    data: [],
                    borderColor: '#14F195',
                    backgroundColor: 'rgba(20, 241, 149, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        console.log('Price chart created');
    }
    
    // Create and add Market Overview chart container if it doesn't exist
    const dashboardView = document.getElementById('dashboard');
    if (dashboardView) {
        let marketContainer = document.querySelector('.market-chart-container');
        if (!marketContainer) {
            const priceContainer = document.querySelector('.price-chart-container');
            if (priceContainer) {
                marketContainer = document.createElement('div');
                marketContainer.className = 'chart-container market-chart-container';
                marketContainer.innerHTML = `
                    <h2>Market Overview</h2>
                    <canvas id="marketChart"></canvas>
                `;
                priceContainer.insertAdjacentElement('afterend', marketContainer);
            }
        }
    }
    
    // Initialize Market Chart
    const marketCanvas = document.getElementById('marketChart');
    if (marketCanvas) {
        const marketCtx = marketCanvas.getContext('2d');
        marketChart = new Chart(marketCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Token Prices',
                    data: [],
                    backgroundColor: [
                        'rgba(20, 241, 149, 0.6)',
                        'rgba(153, 69, 255, 0.6)',
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)'
                    ],
                    borderColor: [
                        'rgba(20, 241, 149, 1)',
                        'rgba(153, 69, 255, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#888' }
                    }
                }
            }
        });
        console.log('Market chart created');
    }
}

// Load token data
async function loadTokenData(symbol) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/token/${symbol}/analysis`);
        const data = await response.json();
        console.log('Token data loaded:', data);
        
        // Update price chart with historical data
        if (data.price_history && priceChart) {
            const hours = 24;
            const labels = data.price_history.timestamps.slice(-hours).map(ts => {
                const date = new Date(ts);
                return date.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            });
            const prices = data.price_history.prices.slice(-hours);
            
            priceChart.data.labels = labels;
            priceChart.data.datasets[0].data = prices;
            priceChart.update();
            console.log('Price chart updated with data');
        }
    } catch (error) {
        console.error('Error loading token data:', error);
    }
}

// Load market overview
async function loadMarketOverview() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/market/overview`);
        const data = await response.json();
        console.log('Market overview loaded:', data);
        
        if (data.tokens && marketChart) {
            const labels = data.tokens.map(t => t.symbol);
            const prices = data.tokens.map(t => t.price);
            
            marketChart.data.labels = labels;
            marketChart.data.datasets[0].data = prices;
            marketChart.update();
            console.log('Market chart updated with data');
        }
    } catch (error) {
        console.error('Error loading market overview:', error);
    }
}

// Handle token selector
document.addEventListener('DOMContentLoaded', () => {
    const tokenSelect = document.getElementById('tokenSelect');
    if (tokenSelect) {
        tokenSelect.addEventListener('change', (e) => {
            loadTokenData(e.target.value);
        });
    }
});